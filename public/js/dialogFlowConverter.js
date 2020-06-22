(function() {

    const FILE_TYPE = {
        TRAINING_PHRASE: 1, 
        ENTITY: 2
    };

    var txtInputJson;
    var ddlFileType;
    var txtLanguageCode;
    var btnSubmit;

    var currentFiles = [];

    var selectedFile = {};

    function valid() {
        var valid = true;

        if (txtInputJson.value.length === 0) {
            valid = false;
        }

        if (txtLanguageCode.value.length === 0) {
            valid = false;
        }

        return valid;
    }

    function getFileText(files) {
        console.log(files);

        var reader = new FileReader();
        reader.addEventListener('load', function(e) {
            txtInputJson.innerText = e.target.result;
            document.getElementById('dlgFile').value = '';
        });
        reader.readAsText(files[0]);
    }

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
      
        element.style.display = 'none';
        document.body.appendChild(element);
      
        element.click();
      
        document.body.removeChild(element);
    }

    function downloadAllFiles() {
        var zip = new JSZip();
        currentFiles.forEach(function(file) {
            zip.file(file.name, file.text);
        });

        zip.generateAsync({type: 'blob'})
            .then(function(content) {
                saveAs(content, 'dialogFlowConversion' + encodeURIComponent(new Date(Date.now()).toISOString()) + '.zip');
            });
    }

    function showDetails(index) {
        var file = currentFiles[index];
        var lstFiles = document.getElementById("lstFiles");

        lstFiles.querySelectorAll('.active').forEach(function(activeButton) {
            activeButton.classList.remove('active');
        });

        document.getElementById('fileName').innerText = file.name;
        document.getElementById('txtFileContents').innerText = file.text;

        selectedFile = {
            file: file, 
            index: index
        };


        lstFiles.querySelectorAll('.list-group-item').forEach(function(item, itemIndex) {
            if (itemIndex === index) {
                item.classList.add('active');
            }
        });

    }

    function buildFileView() {
        var outputCard = document.getElementById('outputCard');
        if (currentFiles.length > 0) {
            outputCard.classList.remove('no-files');
        } else if (!outputCard.classList.contains('no-files')) {
            outputCard.classList.add('no-files');
        }

        lstFiles.innerHTML = '';

        currentFiles.forEach(function(file, index) {
            var lstFiles = document.getElementById("lstFiles");
            var fileButton = document.createElement('a');
            fileButton.setAttribute('href', '#');
            fileButton.setAttribute('title', file.name);
            fileButton.className = 'list-group-item list-group-item-action';
            fileButton.innerHTML = file.name;
            lstFiles.appendChild(fileButton);
            fileButton.addEventListener("click", function(e) {
                showDetails(index);
            });
        });

        if (currentFiles.length > 0) {
            showDetails(0);
        }
    }

    function processTrainingPhrases(jsonObj) {
        function buildTrainingPhraseDefinition(name) {
            return {
                id: null, 
                name: name, 
                auto: true, 
                contexts: [], 
                responses: [
                    {
                        resetContexts: false, 
                        affectedContexts: [], 
                        parameters: [], 
                        messages: [], 
                        defaultIntentResponsePlatforms: {}, 
                        speech: []
                    }
                ], 
                priority: 500000, 
                webhooksUsed: false, 
                webhookForSlotFilling: false, 
                fallbackIntent: false, 
                events: [], 
                conditionalResponses: [], 
                condition: "", 
                conditionalFollowUpEvents: []
            }
        }

        function buildPhrase(phrase) {
            return {
                id: null, 
                data: [
                    {
                        text: phrase, 
                        userDefined: false
                    }
                ], 
                isTemplate: false, 
                count: 0, 
                updated: 0
            }
        }

        Object.keys(jsonObj).forEach(function(trainingPhraseName) {
            currentFiles.push({
                name: trainingPhraseName + ".json",
                text: JSON.stringify(buildTrainingPhraseDefinition(trainingPhraseName)) 
            });

            var phrases = [];
            if (Array.isArray(jsonObj[trainingPhraseName])) {
                jsonObj[trainingPhraseName].forEach(function(phrase) {
                    phrases.push(buildPhrase(phrase));
                });
            } else {
                jsonObj[trainingPhraseName]
                    .split('\n')
                    .map(function(phrase) {
                        return phrase.replace(/^[-\' ]*(.*?)[-\' ]*$/, '$1');
                    })
                    .filter(function(phrase) {
                        return phrase !== ""
                    }).forEach(function(phrase) {
                        phrases.push(buildPhrase(phrase));
                    });
            }

            currentFiles.push({ 
                name: trainingPhraseName + '_usersays_' + txtLanguageCode.value + '.json', 
                text: JSON.stringify(phrases)
            });
        });

        buildFileView();
    }

    function processEntity(jsonObj) {
        function buildEntityDefinition(name) {
            return {
                id: null,
                name: name,
                isOverridable: true,
                isEnum: false,
                isRegexp: false,
                automatedExpansion: false,
                allowFuzzyExtraction: false
            }
        }

        Object.keys(jsonObj).forEach(function(entityName) {
            
            currentFiles.push({
                name: entityName + ".json",
                text: JSON.stringify(buildEntityDefinition(entityName)) 
            });

            var valuesAndSynonyms = [];
            Object.keys(jsonObj[entityName]).forEach(function(entityEntry) {
                valuesAndSynonyms.push({
                    synonyms: jsonObj[entityName][entityEntry].synonyms, 
                    value: jsonObj[entityName][entityEntry].value
                });
            });

            currentFiles.push({
                name: entityName + "_entries_" + txtLanguageCode.value + ".json", 
                text: JSON.stringify(valuesAndSynonyms)
            });

        });

        buildFileView();
    }

    function beginProcessing() {
        if (valid()) {
            currentFiles = [];
            var jsonObj = JSON.parse(txtInputJson.value); 

            if (Number(ddlFileType.value) === FILE_TYPE.TRAINING_PHRASE) {
                processTrainingPhrases(jsonObj);
            } else { 
                processEntity(jsonObj);
            }
        }
    }

    function initialLoad() {
        btnSubmit = document.querySelector('.btn.btn-primary');
        txtLanguageCode = document.getElementById('txtLanguageCode');
        txtInputJson = document.getElementById('txtInputJson');
        ddlFileType = document.getElementById('ddlFileType');
        dvOutputCards = document.getElementById('outputCards');
    }

    function addEventListeners() {
        btnSubmit.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            beginProcessing();
        });

        document.getElementById('btnRemoveAllFiles').addEventListener('click', function() {
            currentFiles = [];
            buildFileView();
        });

        document.getElementById('btnRemoveSelectedFile').addEventListener('click', function() {
            if (selectedFile) {
                currentFiles.splice(selectedFile.index, 1);
                buildFileView();
            }
        });

        document.getElementById('btnDownloadSelectedFile').addEventListener('click', function() {
            if (selectedFile) {
                download(selectedFile.file.name, selectedFile.file.text);
            }
        });

        document.getElementById('btnDownloadAllFiles').addEventListener('click', function() {
            downloadAllFiles();
        });

        document.getElementById('dlgFile').addEventListener('change', function(e) {
            getFileText(e.target.files);
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        initialLoad();
        addEventListeners();
    });

})();