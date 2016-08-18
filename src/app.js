(function () {
    "use strict";

    var itemIdCount = 0;

    var photoTemplate = document.getElementById("photo-template");
    var photosContainer = document.getElementById("photos-container");

    function appendPhoto(feedItem) {
        var photoInstance = document.importNode(photoTemplate.content, true);
        var imgElement = photoInstance.querySelector("img");
        feedItem.domId = "photo-item-" + itemIdCount++;
        imgElement.setAttribute("id", feedItem.domId);
        imgElement.setAttribute("src", feedItem.media.m);
        photosContainer.appendChild(photoInstance);
    }

    function removePhoto(feedItem) {
        var photoElement = document.getElementById(feedItem.domId);
        if (photoElement)
            photosContainer.removeChild(photoElement);
    }

    function isSameItem(item1, item2) {
        return item1.link === item2.link;
    }

    fetchFeed();
    window.setInterval(function () {
        itemsInDom.replaceOne();
        if (itemBuffer.size() < 3) {
            fetchFeed();
        }
    }, 3000);

    var itemsInDom = {
        maxNumberOfItems: 8,
        items: [],
        updateDom: function () {
            while(this.items.length < this.maxNumberOfItems && itemBuffer.numberOfLoadedItems() > 0) {
                var newItem = itemBuffer.dequeueItem();
                console.log("new item", newItem)
                this.items.unshift(newItem);
                appendPhoto(newItem);
            }
        },
        replaceOne: function () {
            if (this.items.length > 0 && itemBuffer.numberOfLoadedItems() > 0) {
                var toRemove = this.items.pop();
                removePhoto(toRemove);
                this.updateDom();
            }
        }
    };

    var itemBuffer = {
        unloadedItems: [],
        loadedItems: [],
        enqueueItem: function (item) {
            if (this.containsItem(item)) return;
            this.unloadedItems.push(item);

            // preload image
            var img=new Image();
            img.src=item.media.m;
            img.addEventListener("load", function () {
                itemBuffer.unloadedItems.splice(itemBuffer.unloadedItems.indexOf(item), 1);
                itemBuffer.loadedItems.unshift(item);
                itemsInDom.updateDom();
            });
        },
        dequeueItem: function () {
            if (this.loadedItems.length === 0) return null;

            return this.loadedItems.pop();
        },
        containsItem: function (item) {
            return this.unloadedItems.some(isSameItem.bind(item)) || this.loadedItems.some(isSameItem.bind(item));
        },
        size: function () {
            return this.unloadedItems.length + this.loadedItems.length;
        },
        numberOfLoadedItems: function () {
            return this.loadedItems.length;
        }
    };

    function handleFlickrFeed(response) {
        response.items.forEach(function (item) {
            itemBuffer.enqueueItem(item);
        });
    }

    function fetchFeed() {
        var scriptElement = document.createElement("script");
        scriptElement.src = "https://api.flickr.com/services/feeds/photos_public.gne?format=json";
        window.jsonFlickrFeed = function jsonFlickrFeed(response) {
            document.head.removeChild(scriptElement);
            handleFlickrFeed(response);
        };
        document.head.appendChild(scriptElement);
    }
})();