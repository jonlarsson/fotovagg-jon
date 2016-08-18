(function () {
    "use strict";

    var photosContainer = document.getElementById("photos-container");

    function createPhotoElement(feedItem) {
        var divElement = document.createElement("div");
        var imgElement = document.createElement("img");
        divElement.appendChild(imgElement);
        imgElement.setAttribute("src", feedItem.media.m);
        return divElement;
    }

    function appendPhoto(photoElement) {
        photosContainer.appendChild(photoElement);
        return photoElement;
    }

    function replacePhoto(newElement, elementToReplace) {
        photosContainer.insertBefore(newElement, elementToReplace);
        photosContainer.removeChild(elementToReplace);
    }

    function removePhoto(elementToRemove) {
        photosContainer.removeChild(elementToRemove);
    }

    var photosInDom = {
        numberOfItems: 0,
        elements: [],
        setNumberOfItems: function (newNumber) {
            for (var i = this.numberOfItems; i < newNumber; i++) {
                itemBuffer.dequeueItem(function (item) {
                    var photoElement = createPhotoElement(item);
                    appendPhoto(photoElement);
                    photosInDom.elements.push(photoElement);
                });
            }
            this.numberOfItems = newNumber;
            this.elements.slice(this.numberOfItems).forEach(removePhoto);
            this.elements = this.elements.slice(0, this.numberOfItems);
        },
        replaceOne: function () {
            if (this.elements.length > 0) {
                itemBuffer.dequeueItem(function (item) {
                    var indexToReplace = Math.floor(Math.random() * (photosInDom.elements.length - 1));
                    var newPhotoElement = createPhotoElement(item);
                    var toRemove = photosInDom.elements[indexToReplace];
                    replacePhoto(newPhotoElement, toRemove);
                    photosInDom.elements[indexToReplace] = newPhotoElement;
                });
            }
        }
    };

    function isSameItem(item1, item2) {
        return item1.link === item2.link;
    }

    var itemBuffer = {
        unloadedItems: [],
        loadedItems: [],
        dequeueCallbacks: [],
        enqueueItem: function (item) {
            if (this.containsItem(item)) return;
            this.unloadedItems.push(item);

            // preload image
            var img = new Image();
            img.src = item.media.m;
            img.addEventListener("load", function () {
                itemBuffer.unloadedItems.splice(itemBuffer.unloadedItems.indexOf(item), 1);
                itemBuffer.loadedItems.unshift(item);
                itemBuffer.serveDequeueCallbacks();
            });
        },
        dequeueItem: function (callback) {
            if (this.size() < 4) {
                fetchFeed();
            }
            this.dequeueCallbacks.push(callback);
            this.serveDequeueCallbacks();
        },
        serveDequeueCallbacks: function () {
            while (this.loadedItems.length > 0 && this.dequeueCallbacks.length > 0) {
                this.dequeueCallbacks.pop()(this.loadedItems.pop());
            }
        },
        containsItem: function (item) {
            return this.unloadedItems.some(isSameItem.bind(item)) || this.loadedItems.some(isSameItem.bind(item));
        },
        size: function () {
            return this.unloadedItems.length + this.loadedItems.length;
        }
    };

    function fetchFeed() {
        if (window.jsonFlickrFeed)
            return;

        var scriptElement = document.createElement("script");
        scriptElement.src = "https://api.flickr.com/services/feeds/photos_public.gne?format=json";
        window.jsonFlickrFeed = function jsonFlickrFeed(response) {
            document.head.removeChild(scriptElement);
            response.items.forEach(function (item) {
                itemBuffer.enqueueItem(item);
            });
            window.jsonFlickrFeed = null;
        };
        document.head.appendChild(scriptElement);
    }

    photosInDom.setNumberOfItems(9);
    window.setInterval(function () {
        photosInDom.replaceOne();
    }, 2000);

    var numberOfPhotosInput = document.getElementById("number-of-photos-input");
    numberOfPhotosInput.value = 9;

    numberOfPhotosInput.addEventListener("change", function () {
        photosInDom.setNumberOfItems(parseInt(numberOfPhotosInput.value));
    })
})();