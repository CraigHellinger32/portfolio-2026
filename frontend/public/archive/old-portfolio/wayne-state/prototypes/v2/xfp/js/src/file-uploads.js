function FileUploads() {

    this.init = function() {
        var that = this;

        fileUploads = document.querySelectorAll('.form__dropzone');

        for (var i = 0; i < fileUploads.length; i++) {

            fileUploads[i].className += ' xforms_dropzone';

            var dzMessage = fileUploads[i].querySelector('.dz-message.hidden');
            dzMessage.className = dzMessage.className.replace(new RegExp('(^|\\b)hidden(\\b|$)', 'gi'), ' ');

            var input = document.getElementById(fileUploads[i].getAttribute('data-id'));
            input.setAttribute('type', 'hidden');
            input.value = '[]';
            input.removeAttribute('multiple');
            input.setAttribute('data-is-file', 'true');

            var dzData = {
                url: "/xfp/form/file-upload",
                addRemoveLinks: true,
                removedfile: function(file) {
                    var name = file.name,
                        _ref,
                        xmlhttp = new XMLHttpRequest();

                    if (file.guid) {
                        var deleteEndpoint = '/xfp/form/file-upload?action=delete&file='+file.guid;
                        xmlhttp.open("GET", deleteEndpoint, true);
                        xmlhttp.send();

                        var input = document.getElementById(this.element.getAttribute('data-id')),
                        files = JSON.parse(input.value),
                        indexToRemove = files.indexOf(file.guid);

                        if (indexToRemove > -1) {
                            files.splice(indexToRemove, 1);
                        }

                        input.value = JSON.stringify(files);
                        that.triggerChange(input);
                    }

                    return (_ref = file.previewElement) != null ? _ref.parentNode.removeChild(file.previewElement) : void 0;
                },
                init: function () {
                    var mocks = JSON.parse(document.getElementById(this.element.getAttribute('data-id')+'-files').value);

                    if (mocks != '[]') {
                        var input = document.getElementById(this.element.getAttribute('data-id'));

                        actualValues = [];
                        for (var i = 0; i < mocks.length; i++) {
                            var mock = mocks[i];
                            mock.accepted = true;
                            actualValues.push(mock.guid);

                            this.files.push(mock);
                            this.emit('addedfile', mock);
                            this.emit("thumbnail", mock, undefined);
                            this.emit('complete', mock);
                        }

                        input.value = JSON.stringify(actualValues);
                        that.triggerChange(input);
                    }

                    if (this.hiddenFileInput) {
                        this.hiddenFileInput.setAttribute('aria-hidden', 'true');
                        this.hiddenFileInput.setAttribute('title', 'File Upload');
                    }
                },
                // This is overridden to ensure the <img> tag is not on screen when no image is available
                thumbnail: function(file, dataUrl) {
                    var thumbnailElement, _i, _len, _ref;
                    var hasDataUrl = typeof dataUrl !== 'undefined';
                    if (file.previewElement) {
                        if (hasDataUrl) {
                            file.previewElement.classList.remove("dz-file-preview");
                        }

                        _ref = file.previewElement.querySelectorAll("[data-dz-thumbnail]");
                        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                            thumbnailElement = _ref[_i];

                            if (hasDataUrl) {
                                thumbnailElement.alt = file.name;
                                thumbnailElement.src = dataUrl;
                            } else {
                                thumbnailElement.parentNode.removeChild(thumbnailElement);
                            }
                        }

                        if (!hasDataUrl) {
                            return;
                        }

                        return setTimeout(((function(_this) {
                            return function() {
                                return file.previewElement.classList.add("dz-image-preview");
                            };
                        })(this)), 1);
                    }
                },
                previewTemplate: "<div class=\"dz-preview dz-file-preview\"><div class=\"dz-image\"><img data-dz-thumbnail/></div><div class=\"dz-details\"><div class=\"dz-size\"><span data-dz-size></span></div><div class=\"dz-filename\"><span data-dz-name></span></div></div><div class=\"dz-progress\"><span class=\"dz-upload\" data-dz-uploadprogress></span></div><div class=\"dz-error-message\"><span data-dz-errormessage></span></div><div class=\"dz-success-mark\"><svg version=\"1.1\" width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" xmlns=\"http://www.w3.org/2000/svg\"><title>Check</title><g fill=\"none\" fill-rule=\"evenodd\"><path d=\"M23.5,31.8431458 L17.5852419,25.9283877 C16.0248253,24.3679711 13.4910294,24.366835 11.9289322,25.9289322 C10.3700136,27.4878508 10.3665912,30.0234455 11.9283877,31.5852419 L20.4147581,40.0716123 C20.5133999,40.1702541 20.6159315,40.2626649 20.7218615,40.3488435 C22.2835669,41.8725651 24.794234,41.8626202 26.3461564,40.3106978 L43.3106978,23.3461564 C44.8771021,21.7797521 44.8758057,19.2483887 43.3137085,17.6862915 C41.7547899,16.1273729 39.2176035,16.1255422 37.6538436,17.6893022 L23.5,31.8431458 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" fill=\"#fff\" fill-opacity=\".81652\" stroke=\"#747474\" stroke-opacity=\".19879\"/></g></svg></div><div class=\"dz-error-mark\"><svg version=\"1.1\" width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" xmlns=\"http://www.w3.org/2000/svg\"><title>Error</title><g fill=\"none\" fill-rule=\"evenodd\"><g fill=\"#fff\" fill-opacity=\".81652\" stroke=\"#747474\" stroke-opacity=\".19879\"><path d=\"M32.6568542,29 L38.3106978,23.3461564 C39.8771021,21.7797521 39.8758057,19.2483887 38.3137085,17.6862915 C36.7547899,16.1273729 34.2176035,16.1255422 32.6538436,17.6893022 L27,23.3431458 L21.3461564,17.6893022 C19.7823965,16.1255422 17.2452101,16.1273729 15.6862915,17.6862915 C14.1241943,19.2483887 14.1228979,21.7797521 15.6893022,23.3461564 L21.3431458,29 L15.6893022,34.6538436 C14.1228979,36.2202479 14.1241943,38.7516113 15.6862915,40.3137085 C17.2452101,41.8726271 19.7823965,41.8744578 21.3461564,40.3106978 L27,34.6568542 L32.6538436,40.3106978 C34.2176035,41.8744578 36.7547899,41.8726271 38.3137085,40.3137085 C39.8758057,38.7516113 39.8771021,36.2202479 38.3106978,34.6538436 L32.6568542,29 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\"/></g></g></svg></div></div>",
            };

            var limit = fileUploads[i].getAttribute('data-count'),
                types = fileUploads[i].getAttribute('data-types');

            if (limit) {
                dzData.maxFiles = limit;
            }

            if (types) {
                dzData.acceptedFiles = types;
            }

            var dz = new Dropzone(
                fileUploads[i],
                dzData
            );

            dz.on("success", function(file, response) {
                file.guid = response.guid;

                var input = document.getElementById(this.element.getAttribute('data-id')),
                    files = JSON.parse(input.value);

                files.push(response.guid);
                input.value = JSON.stringify(files);
                that.triggerChange(input);
            });
        }
    }

    this.triggerChange = function(element) {
        var eventName = 'change',
            event;

        if (typeof(Event) === 'function') {
            event = new Event(eventName);
        } else {
            event = document.createEvent('Event');
            event.initEvent(eventName, true, true);
        }

        element.dispatchEvent(event);
    }
}
