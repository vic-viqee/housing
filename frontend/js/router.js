/*
  =====================================================
  router.js — SPA Router & Event Handlers (Embu Edition)
  =====================================================
  This is the heart of our Single Page Application.

  EMBU FOCUS:
  - The app is now Embu-only — there is no city selector.
  - The default city for API calls is always "Embu".
  - Instead of cities, we filter by areas (neighbourhoods).

  URL PATTERNS:
  #/                          → Home (area grid + featured listings)
  #/browse                    → Browse all Embu listings
  #/browse?area=Gakwegori     → Browse listings in a specific area
  #/browse?search=near gate   → Browse with search
  #/listing/3                 → Detail for listing ID 3
  #/add                       → Add listing form
  #/about                     → About / safety page
*/


/**
 * Navigate to a new route by changing the hash.
 * Setting window.location.hash triggers the hashchange
 * event, which the router listens for.
 *
 * @param {string} hash - The route hash (e.g., "#/browse")
 */
function navigate(hash) {
    window.location.hash = hash;
}

/**
 * Parse the current URL hash to extract the path and
 * query/path parameters.
 *
 * EXAMPLES:
 * Input:  "#/browse?area=Gakwegori&min_price=3000"
 * Output: { path: "/browse", params: { area: "Gakwegori", min_price: "3000" } }
 *
 * Input:  "#/listing/3"
 * Output: { path: "/listing", params: { id: "3" } }
 *
 * @returns {object} - { path: string, params: object }
 */
function getRouteParams() {
    const hash = window.location.hash.slice(1) || '/';
    const [pathPart, qs] = hash.split('?');
    const params = {};

    // Parse query string params (e.g., ?area=Gakwegori)
    if (qs) {
        qs.split('&').forEach(pair => {
            const [k, v] = pair.split('=').map(decodeURIComponent);
            params[k] = v;
        });
    }

    // Split path into segments: "/listing/3" → ["", "listing", "3"]
    const segments = pathPart.split('/');
    // First segment is always empty (from leading /), so the route is segments[1]
    const route = segments[1] ? '/' + segments[1] : '/';
    // If there's a second segment, it's a path parameter (like a listing ID)
    if (segments[2]) {
        params.id = segments[2];
    }

    return { path: route, params };
}

/**
 * THE MAIN ROUTER FUNCTION.
 * This is called on every hashchange and on page load.
 *
 * WORKFLOW:
 * 1. Parse the URL hash to get path and params
 * 2. Show a loading indicator
 * 3. Based on the path, fetch data and render the page
 * 4. If anything fails, show an error message
 */
async function router() {
    const { path, params } = getRouteParams();
    const app = document.getElementById('app');

    // Step 1: Show loading state immediately
    app.innerHTML = renderLoading();

    try {
        // Step 2: Match the path and handle each route
        switch (path) {
            // ========== HOME PAGE ==========
            case '/':
                /*
                  Fetch areas and listings in PARALLEL.
                  Both are filtered to Embu by default.
                  Promise.all() runs both API calls at the
                  same time for faster load.
                */
                const [areas, listings] = await Promise.all([
                    apiGetAreas(),
                    apiGetListings({ city: 'Embu' }),
                ]);
                AppState.areas = areas;
                AppState.listings = listings;
                AppState.currentArea = null;  // reset area filter
                app.innerHTML = renderHome();
                break;

            // ========== BROWSE PAGE ==========
            case '/browse':
                /*
                  Store selected area and search term.
                  Area and search come from URL query params.
                  Type and price filters persist from AppState.
                */
                AppState.currentArea = params.area || null;
                AppState.filters.search = params.search || null;

                /*
                  Build API parameters.
                  Default city is always "Embu" for this app.
                */
                const browseParams = { city: 'Embu' };
                if (AppState.currentArea) browseParams.area = AppState.currentArea;
                if (AppState.filters.search) browseParams.search = AppState.filters.search;
                if (AppState.filters.listing_type) browseParams.listing_type = AppState.filters.listing_type;
                if (AppState.filters.min_price !== null) browseParams.min_price = AppState.filters.min_price;
                if (AppState.filters.max_price !== null) browseParams.max_price = AppState.filters.max_price;

                const browseListings = await apiGetListings(browseParams);
                AppState.listings = browseListings;
                app.innerHTML = renderBrowse();
                break;

            // ========== LISTING DETAIL ==========
            case '/listing':
                if (params.id) {
                    const listing = await apiGetListing(params.id);
                    AppState.currentListing = listing;
                    app.innerHTML = renderDetail();
                } else {
                    app.innerHTML = renderError('No listing ID provided.');
                }
                break;

            // ========== ADD LISTING FORM ==========
            case '/add':
                // Fetch areas so the dropdown is populated from the database
                try {
                    AppState.areas = await apiGetAreas();
                } catch (_) { /* fallback to hardcoded list */ }
                app.innerHTML = renderAddListing();
                break;

            // ========== ABOUT PAGE ==========
            case '/about':
                app.innerHTML = renderAbout();
                break;

            // ========== ADMIN DASHBOARD ==========
            case '/admin':
                const allListings = await apiGetListings();
                const allAreas = await apiGetAreas();
                AppState.listings = allListings;
                AppState.areas = allAreas;
                app.innerHTML = renderAdmin();
                break;

            // ========== 404 - PAGE NOT FOUND ==========
            default:
                app.innerHTML = `
                    <div class="error-state">
                        <h3>Page not found</h3>
                        <p>The page you're looking for doesn't exist.</p>
                        <a href="#/" onclick="navigate('#/')">Go Home</a>
                    </div>`;
        }
    } catch (err) {
        console.error('Router error:', err);
        app.innerHTML = renderError(err.message);
    }
}


// =====================================================
// FILTER HANDLERS
// =====================================================

/**
 * Set a text-based filter (listing_type).
 * Re-navigates to browse with the new filter applied.
 *
 * @param {string} key - The filter key ("listing_type")
 * @param {string} value - The filter value (e.g., "bedsit")
 */
function setFilter(key, value) {
    AppState.filters[key] = value || null;
    navigateToBrowse();
}

/**
 * Set price range filters.
 * Re-navigates to browse with the selected price range.
 *
 * @param {number|null} min - Minimum price (null for no minimum)
 * @param {number|null} max - Maximum price (null for no maximum)
 */
function setPriceFilter(min, max) {
    AppState.filters.min_price = min;
    AppState.filters.max_price = max;
    navigateToBrowse();
}

/**
 * Helper: navigate to browse while preserving the current area filter.
 * This is used by setFilter() and setPriceFilter() so the area
 * selection is maintained when changing type/price.
 */
function navigateToBrowse() {
    let hash = '#/browse';
    const params = [];
    if (AppState.currentArea) params.push(`area=${encodeURIComponent(AppState.currentArea)}`);
    if (params.length) hash += '?' + params.join('&');
    navigate(hash);
}


// =====================================================
// FORM SUBMISSION HANDLERS
// =====================================================

/**
 * Handle the "Add Listing" form submission.
 *
 * STEPS:
 * 1. Prevent the default form submission
 * 2. Disable button, show "Submitting..."
 * 3. Build FormData from form fields
 * 4. Send to API via apiCreateListing()
 * 5. Show success/error message
 * 6. Re-enable button
 *
 * @param {Event} event - The form submission event
 */
async function submitListing(event) {
    event.preventDefault();
    const resultDiv = document.getElementById('add-result');
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
        const formData = new FormData();
        formData.append('title', document.getElementById('add-title').value.trim());
        formData.append('description', document.getElementById('add-description').value.trim());
        formData.append('price', document.getElementById('add-price').value);
        formData.append('city', document.getElementById('add-city').value);  // hidden, always "Embu"
        formData.append('area', document.getElementById('add-area').value);
        formData.append('listing_type', document.getElementById('add-type').value);
        formData.append('amenities', document.getElementById('add-amenities').value.trim());
        formData.append('landlord_name', document.getElementById('add-landlord-name').value.trim());
        formData.append('landlord_phone', document.getElementById('add-landlord-phone').value.trim());

        const fileInput = document.getElementById('add-images');
        for (const file of fileInput.files) {
            formData.append('images', file);
        }

        await apiCreateListing(formData);
        resultDiv.innerHTML = '<div class="alert alert-success">🎉 Listing submitted successfully! It will appear on the platform shortly.</div>';
        event.target.reset();
    } catch (err) {
        resultDiv.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Listing';
    }
}

/**
 * Handle the "Contact Landlord" form submission on the detail page.
 *
 * @param {Event} event - The form submission event
 * @param {number} listingId - The listing ID to contact about
 */
async function submitContact(event, listingId) {
    event.preventDefault();
    const resultDiv = document.getElementById('contact-result');
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
        const data = {
            student_name: document.getElementById('contact-name').value.trim(),
            student_phone: document.getElementById('contact-phone').value.trim(),
            message: document.getElementById('contact-msg').value.trim(),
        };
        const res = await apiContactLandlord(listingId, data);
        resultDiv.innerHTML = `<div class="alert alert-success">${res.message}</div>`;
        event.target.reset();
    } catch (err) {
        resultDiv.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Enquiry';
    }
}


// =====================================================
// ADMIN HANDLERS
// =====================================================

/**
 * Select a listing for editing.
 * Sets editingListingId in state and re-renders the admin page.
 *
 * @param {number} id - The listing ID to edit
 */
function editListing(id) {
    AppState.editingListingId = id;
    router();
}

/**
 * Cancel editing and go back to the admin table view.
 */
function cancelEdit() {
    AppState.editingListingId = null;
    router();
}

/**
 * Save changes for a listing being edited.
 * Collects form values from the admin edit form,
 * calls apiUpdateListing, then re-renders admin.
 *
 * @param {number} id - The listing ID being edited
 */
async function saveEdit(id) {
    const btn = document.querySelector('#admin-edit-form button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const data = {
            title: document.getElementById('admin-edit-title').value.trim(),
            price: parseFloat(document.getElementById('admin-edit-price').value),
            area: document.getElementById('admin-edit-area').value,
            listing_type: document.getElementById('admin-edit-type').value,
            landlord_name: document.getElementById('admin-edit-landlord-name').value.trim(),
            landlord_phone: document.getElementById('admin-edit-landlord-phone').value.trim(),
            amenities: document.getElementById('admin-edit-amenities').value.trim(),
            verified: document.getElementById('admin-edit-verified').checked,
        };
        await apiUpdateListing(id, data);
        AppState.editingListingId = null;
        router();
    } catch (err) {
        alert('Error saving: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
}

/**
 * Toggle the verified status of a listing.
 *
 * @param {number} id - The listing ID
 * @param {boolean} currentVerified - Current verified state
 */
async function toggleVerify(id, currentVerified) {
    try {
        await apiUpdateListing(id, { verified: !currentVerified });
        router();
    } catch (err) {
        alert('Error toggling verification: ' + err.message);
    }
}

/**
 * Delete a listing after user confirmation.
 *
 * @param {number} id - The listing ID to delete
 */
async function deleteListing(id) {
    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
        return;
    }
    try {
        await apiDeleteListing(id);
        if (AppState.editingListingId === id) {
            AppState.editingListingId = null;
        }
        router();
    } catch (err) {
        alert('Error deleting listing: ' + err.message);
    }
}

/**
 * Add a new area (from the admin page).
 * Reads the area name input, calls the API, and re-renders admin.
 */
async function addArea() {
    const input = document.getElementById('admin-new-area-name');
    const name = input.value.trim();
    if (!name) return;

    const resultDiv = document.getElementById('admin-area-result');
    try {
        const area = await apiCreateArea(name);
        resultDiv.innerHTML = `<div class="alert alert-success">Area "${area.name}" added successfully.</div>`;
        input.value = '';
        // Re-fetch areas to update the dropdowns everywhere
        AppState.areas = await apiGetAreas();
        router();
    } catch (err) {
        resultDiv.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
}

/**
 * Delete an area (from the admin page).
 * Shows a confirmation dialog first.
 *
 * @param {number} id - The area ID to delete
 */
async function deleteArea(id) {
    if (!confirm('Are you sure you want to delete this area?')) {
        return;
    }
    const resultDiv = document.getElementById('admin-area-result');
    try {
        await apiDeleteArea(id);
        resultDiv.innerHTML = `<div class="alert alert-success">Area deleted.</div>`;
        AppState.areas = await apiGetAreas();
        router();
    } catch (err) {
        resultDiv.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
}
