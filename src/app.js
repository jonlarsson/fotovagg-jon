(function () {
    "use strict";

    var currentItems = [];
    var itemIdCount = 0;

    var photoTemplate = document.getElementById("photo-template");
    var photosContainer = document.getElementById("photos-container");

    fetchFeed();
    window.setInterval(fetchFeed, 1000);

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

    function handleFlickrFeed(response) {
        var newItems = response.items.filter(function (item) {
            return !currentItems.some(isSameItem.bind(this, item));
        }).reverse();

        var itemsToKeep = currentItems.filter(function (currentItem) {
            return response.items.some(isSameItem.bind(this, currentItem));
        });

        var itemsToRemove = currentItems.filter(function (currentItem) {
            return !response.items.some(isSameItem.bind(this, currentItem));
        });

        itemsToRemove.forEach(removePhoto);
        newItems.forEach(appendPhoto);

        console.log(newItems.length, itemsToRemove.length)

        currentItems = itemsToKeep.concat(newItems);
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