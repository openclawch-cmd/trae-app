// ==UserScript==
// @name         Amazon Product Blocker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Block Amazon product listings and persist settings
// @author       You
// @match        https://www.amazon.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

(function() {
    'use strict';

    const BLOCKED_LISTINGS_KEY = 'blockedAmazonListings';

    // Function to get blocked listings from storage
    function getBlockedListings() {
        let blocked = GM_getValue(BLOCKED_LISTINGS_KEY, '[]');
        return JSON.parse(blocked);
    }

    // Function to save blocked listings to storage
    function saveBlockedListings(blockedListings) {
        GM_setValue(BLOCKED_LISTINGS_KEY, JSON.stringify(blockedListings));
    }

    // Function to block a listing
    function blockListing(listingElement) {
        const asin = listingElement.dataset.asin;
        if (asin) {
            let blocked = getBlockedListings();
            if (!blocked.includes(asin)) {
                blocked.push(asin);
                saveBlockedListings(blocked);
            }
            listingElement.style.display = 'none'; // Hide the listing
            console.log(`Blocked listing with ASIN: ${asin}`);
        }
    }

    // Function to add a block button to each listing
    function addBlockButtons() {
        // This selector might need adjustment based on Amazon's ever-changing DOM
        const listings = document.querySelectorAll('[data-asin]'); 

        listings.forEach(listing => {
            if (!listing.querySelector('.block-button-added')) { // Avoid adding multiple buttons
                const button = document.createElement('button');
                button.textContent = 'Block';
                button.classList.add('block-button-added');
                button.style.cssText = 'background-color: #f00; color: #fff; border: none; padding: 5px 10px; cursor: pointer; margin-left: 10px;';

                button.addEventListener('click', () => {
                    blockListing(listing);
                });

                // Find a good place to insert the button
                const titleElement = listing.querySelector('h2 a span'); // Common path for title
                if (titleElement) {
                    titleElement.parentNode.appendChild(button);
                } else {
                    // Fallback if title element not found, append to the listing itself
                    listing.prepend(button); 
                }
            }
        });
    }

    // Function to hide already blocked listings on page load
    function hideBlockedListings() {
        const blocked = getBlockedListings();
        if (blocked.length > 0) {
            blocked.forEach(asin => {
                const listing = document.querySelector(`[data-asin="${asin}"]`);
                if (listing) {
                    listing.style.display = 'none';
                    console.log(`Hid previously blocked listing with ASIN: ${asin}`);
                }
            });
        }
    }

    // Run on page load and when new content is added (e.g., infinite scroll)
    function observeDOMChanges() {
        hideBlockedListings();
        addBlockButtons();

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    hideBlockedListings();
                    addBlockButtons();
                }
            });
        });

        // Observe the main content area for changes. This might need to be more specific.
        const mainContent = document.getElementById('search'); // Common ID for search results
        if (mainContent) {
            observer.observe(mainContent, { childList: true, subtree: true });
        } else {
            // Fallback for other Amazon pages or if 'search' ID is not present
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    observeDOMChanges();
})();
