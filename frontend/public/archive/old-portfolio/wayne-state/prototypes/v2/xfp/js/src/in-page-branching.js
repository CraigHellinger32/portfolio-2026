function InPageBranching() {

    this.init = function() {
        if (document.getElementById('question-holder') === null) return; // CHECK ADDED TO FIX CONSOLE ERROR IN HTML PROTOTYPES

        this.addAllListeners(document.getElementById('question-holder').childNodes);
    }

    this.addAllListeners = function (questionHolders) {
        var branchedSections = document.querySelectorAll(".js-branch-section");
        for (var i=0; i < branchedSections.length; i++) {
            this.addListener(branchedSections[i], questionHolders);
        }
    }

    this.addListener = function(section, questionHolders) {
        var branchData = JSON.parse(section.getAttribute('data-branching')),
            questionName = branchData.on.question,
            questionSection = branchData.on.section,
            questionSecondary = branchData.on.secondary,
            trigger = branchData.when,
            operator = branchData.operator
            question = this.findQuestion(questionHolders, questionName, questionSection, questionSecondary),
            that = this;

        if (!question) {
            return;
        }

        if (question.length == 1) {
            var isFile = question[0].getAttribute('data-is-file') == 'true';

            if (this.evaluateRule(question[0].value, operator, trigger, this.getDataValueFromQuestion(question[0]), isFile)) {
                section.style.display = 'block';
            }
            else {
                section.style.display = 'none';
            }

            var handleEvent = function(evt) {
                if (that.evaluateRule(this.value, operator, trigger, that.getDataValueFromQuestion(this), isFile)) {
                    section.style.display = 'block';
                }
                else {
                    section.style.display = 'none';
                }
            }

            question[0].addEventListener('change', handleEvent);
            question[0].addEventListener('keyup', handleEvent);
        }
        else {
            if (this.evaluateMultiRule(question, operator, trigger, branchData)) {
                section.style.display = 'block';
            }
            else {
                section.style.display = 'none';
            }

            for (var i=0; i < question.length; i++) {
                var handleEvent = function(evt) {
                    var refreshedQuestions = that.findQuestion(questionHolders, questionName, questionSection, questionSecondary);
                    if (that.evaluateMultiRule(refreshedQuestions, operator, trigger, branchData)) {
                        section.style.display = 'block';
                    }
                    else {
                        section.style.display = 'none';
                    }
                }

                question[i].addEventListener('change', handleEvent);
                question[i].addEventListener('keyup', handleEvent);
            }
        }
    }

    this.getDataValueFromQuestion = function (question) {
        var element = question;

        if (question.nodeName === 'SELECT') {
            element = question.options[question.selectedIndex];
        }

        return element.getAttribute('data-xfp');
    }

    this.evaluateMultiRule = function (fields, operator, trigger, branchData) {
        if (fields[0].parentNode.classList.contains('matrix--field') && ['was answered', 'was not answered'].indexOf(operator) === -1) {
            if (branchData.on.secondary) {
                return this.evaluateMatrixTotal(fields, operator, trigger, branchData);
            }

            return false;
        }

        var that = this,
            selectedValues = [],
            evaluations = [],
            parsedTrigger;

        try {
            parsedTrigger = JSON.parse(trigger)
        } catch (e) {
            parsedTrigger = [];
        }

        for (var i=0; i < fields.length; i++) {
            if ((fields[i].type === 'checkbox' || fields[i].type === 'radio') && fields[i].checked === false) {
                continue;
            }

            selectedValues.push(fields[i].value);
            evaluations.push(that.evaluateRule(fields[i].value, operator, trigger, this.getDataValueFromQuestion(fields[i])));
        }

        switch (operator) {
            case 'selection exact':
                return JSON.stringify(selectedValues) === trigger;
            case 'selection not exact':
                return JSON.stringify(selectedValues) !== trigger;
            case 'selection contains':
                return JSON.stringify(selectedValues.filter(function(n) {
                    return parsedTrigger.indexOf(n) > -1;
                })) === trigger;
            case 'selection not contains':
                return JSON.stringify(selectedValues.filter(function(n) {
                    return parsedTrigger.indexOf(n) > -1;
                })) !== trigger;
            case 'was answered':
            case 'contains':
                return evaluations.indexOf(true) > -1;
            default:
                return (operator.substr(0, 3) === "not" || evaluations.length > 0) && evaluations.every(function (value) {
                    return value === true;
                })
        }
    }

    this.evaluateMatrixTotal = function (fields, operator, trigger, branchData) {
        var total = 0;

        for (var j=0; j < fields.length; j++) {
            if (parseInt(fields[j].getAttribute('data-col')) === (parseInt(branchData.on.secondary) + 1) && fields[j].value != '' ) {
                var num = parseFloat(fields[j].value);
                if (!isNaN(num)) {
                    total += num;
                }
            }
        }

        return that.evaluateRule(total, operator, parseInt(trigger));
    }

    this.findQuestion = function(containerElements, questionName, questionSection, questionSecondary) {
        if (questionSection != 'main') {
            var container = document.querySelector('[data-section-name='+questionSection.replace(' ', '\\ ')+']');
            if (container.childNodes[1].className.indexOf('section-content') > -1) {
                containerElements = container.childNodes[1].childNodes;
            }
            else {
                containerElements = container.childNodes[3].childNodes;
            }
        }

        for (var i=0; i < containerElements.length; i++) {
            if (containerElements[i].nodeType != 3 && containerElements[i].className.indexOf('js-question') > 0) {
                if (containerElements[i].querySelectorAll('[name=' + questionName + ']').length > 0) {
                    return containerElements[i].querySelectorAll('[name=' + questionName + ']');
                }

                if (containerElements[i].querySelectorAll('[name="'+questionName+'[]"]').length > 0) {
                    return containerElements[i].querySelectorAll('[name="'+questionName+'[]"]');
                }

                if (containerElements[i].querySelectorAll('.js-is-last-level [name^=' + questionName + ']').length > 0) {
                    return containerElements[i].querySelectorAll('.js-is-last-level [name^=' + questionName + ']');
                }

                if (containerElements[i].querySelectorAll('.matrix--field [name^=' + questionName + ']').length > 0) {
                    return containerElements[i].querySelectorAll('.matrix--field [name^=' + questionName + ']');
                }

                if (questionSecondary && containerElements[i].querySelectorAll('[data-secondary="'+questionSecondary+'"] [name^=' + questionName + ']').length > 0) {
                    return containerElements[i].querySelectorAll('[data-secondary="'+questionSecondary+'"] [name^=' + questionName + ']');
                }
            }
        }
    }

    this.evaluateRule = function(answer, operator, value, dataValue, isFile) {
        if (answer.toLowerCase) {
            answer = answer.toLowerCase();
        }
        if (value && value.toLowerCase) {
            value = value.toLowerCase();
        }

        switch (operator) {
            case 'was answered':
                return (isFile && answer != '[]') || (!isFile && answer != '');
            case 'was not answered':
                return (isFile && answer == '[]') || (!isFile && answer == '');
            case 'equal':
                return answer == value;
            case 'less':
                return answer < value;
            case 'greater':
                return answer > value;
            case 'less equal':
                return answer <= value;
            case 'greater equal':
                return answer >= value;
            case 'not equal':
                return answer != value;
            case 'contains':
                return answer.indexOf(value) !== -1;
            case 'not contains':
                return answer.indexOf(value) === -1;
            case 'starts':
                return answer.indexOf(value) === 0;
            case 'not starts':
                return answer.length > 0 && answer.indexOf(value) !== 0;
            case 'ends':
                return answer.substring(answer.length - value.length) == value;
            case 'not ends':
                return answer.substring(answer.length - value.length) != value;
            case 'in llpg':
                return dataValue == 'true';
            case 'not in llpg':
                return dataValue == 'false';
        }

        return false;
    }
}
