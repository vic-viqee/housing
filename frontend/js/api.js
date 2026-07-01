/*
  =====================================================
  api.js — Backend Communication Layer
  =====================================================
  This file handles ALL communication with our FastAPI
  backend. Every API call goes through one of these
  functions.

  WHY SEPARATE THIS?
  By keeping all fetch() calls in one file, if the
  backend URL changes or we need to add auth tokens,
  we only edit ONE file instead of hunting through
  render.js and router.js.

  HOW FETCH WORKS:
  fetch() is a browser API that sends HTTP requests.
  It returns a Promise that resolves to a Response
  object. We check if the response was OK (status 200-299),
  then parse the JSON body with .json().
*/

// The base URL for all API endpoints.
// All backend routes start with /api (e.g., /api/listings, /api/cities).
const API_BASE = '/api';

/**
 * Generic fetch wrapper.
 * Every API function uses this under the hood.
 *
 * @param {string} path - The endpoint path (e.g., "/listings")
 * @param {object} options - fetch options (method, headers, body, etc.)
 * @returns {Promise<object|null>} - Parsed JSON response, or null for 204 No Content
 * @throws {Error} - If the response status is not OK
 *
 * KEY CONCEPT: async/await
 * async functions return a Promise. The `await` keyword
 * pauses execution until the Promise resolves, making
 * asynchronous code read like synchronous code.
 */
async function apiFetch(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        headers: { 'Accept': 'application/json', ...options.headers },
        ...options,
    });

    // If the server returned an error (4xx or 5xx), throw an error
    if (!res.ok) {
        // Try to parse error detail from FastAPI's standard error response
        // FastAPI returns { "detail": "error message" } on errors
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Request failed (${res.status})`);
    }

    // 204 means "No Content" — used for DELETE responses
    if (res.status === 204) return null;

    // Parse and return the JSON body
    return res.json();
}

/**
 * Fetch listings with optional filter parameters.
 * The query parameters are sent as URL query string:
 * e.g., /api/listings?city=Embu&area=Gakwegori&listing_type=bedsit
 *
 * URLSearchParams is a browser API that handles
 * encoding special characters in query parameters.
 *
 * @param {object} params - { city, area, min_price, max_price, listing_type, search }
 * @returns {Promise<Array>} - Array of listing objects
 */
function apiGetListings(params = {}) {
    // Build query string from params object
    const qs = new URLSearchParams();
    if (params.city) qs.set('city', params.city);
    if (params.area) qs.set('area', params.area);
    if (params.min_price) qs.set('min_price', params.min_price);
    if (params.max_price) qs.set('max_price', params.max_price);
    if (params.listing_type) qs.set('listing_type', params.listing_type);
    if (params.search) qs.set('search', params.search);

    const query = qs.toString();
    // Only add ? if there are query parameters
    return apiFetch(`/listings${query ? '?' + query : ''}`);
}

/**
 * Fetch a single listing by its ID.
 *
 * @param {number} id - The listing's database ID
 * @returns {Promise<object>} - The listing object
 */
function apiGetListing(id) {
    return apiFetch(`/listings/${id}`);
}

/**
 * Create a new listing (landlord submission).
 * Uses FormData because it includes file uploads.
 * 
 * WHY NOT JSON FOR THIS?
 * When uploading files (images), we need multipart/form-data
 * encoding. FormData handles this automatically. The
 * Content-Type header is set by the browser (including the
 * boundary parameter), so we DON'T set it manually here.
 *
 * @param {FormData} formData - Form data with listing fields and image files
 * @returns {Promise<object>} - The created listing
 */
async function apiCreateListing(formData) {
    const res = await fetch(`${API_BASE}/listings`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Failed to create listing');
    }
    return res.json();
}

/**
 * Update a listing (admin use).
 * Sends a JSON body with only the fields to change.
 *
 * @param {number} id - The listing's ID
 * @param {object} data - Fields to update (e.g., { verified: true, price: 5000 })
 * @returns {Promise<object>} - The updated listing
 */
function apiUpdateListing(id, data) {
    return apiFetch(`/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

/**
 * Delete a listing (admin use).
 *
 * @param {number} id - The listing's ID
 * @returns {Promise<null>} - null on success (204 No Content)
 */
function apiDeleteListing(id) {
    return apiFetch(`/listings/${id}`, { method: 'DELETE' });
}

/**
 * Fetch list of areas (neighbourhoods/estates) with listing counts.
 * Used on the home page to populate the area grid.
 *
 * @returns {Promise<Array>} - Array of { name, count } objects
 */
function apiGetAreas() {
    return apiFetch('/areas');
}

/**
 * Create a new area (admin use).
 *
 * @param {string} name - The area name
 * @returns {Promise<object>} - The created area { id, name, count }
 */
function apiCreateArea(name) {
    return apiFetch('/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
}

/**
 * Delete an area (admin use).
 *
 * @param {number} id - The area ID
 * @returns {Promise<null>} - null on success
 */
function apiDeleteArea(id) {
    return apiFetch(`/areas/${id}`, { method: 'DELETE' });
}

/**
 * Submit a contact enquiry for a listing.
 * This sends the student's name, phone, and message
 * to the landlord. The backend just returns the
 * landlord's contact info for now.
 *
 * @param {number} listingId - The listing's ID
 * @param {object} data - { student_name, student_phone, message }
 * @returns {Promise<object>} - Response with landlord details
 */
function apiContactLandlord(listingId, data) {
    return apiFetch(`/contact/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

/**
 * Convert a stored filename to a full URL for the <img> tag.
 * If the filename is already a URL (like an Unsplash URL),
 * return it as-is. Otherwise, it's a local file stored in
 * backend/uploads/, served via /api/images/.
 *
 * @param {string} filename - The image filename or URL
 * @returns {string} - The full URL to display the image
 */
function imageUrl(filename) {
    if (!filename) return '';
    if (filename.startsWith('http')) return filename;
    // Local files are served by FastAPI's StaticFiles mount
    // at the /api/images/ path, which maps to backend/uploads/
    return `/api/images/${filename}`;
}
