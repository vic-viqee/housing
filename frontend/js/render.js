/*
  =====================================================
  render.js — HTML Template Functions (Embu Edition)
  =====================================================
  Each function in this file returns an HTML string for
  a specific page or component. The router calls these
  functions and sets the #app element's innerHTML to
  the returned string.

  PATTERN: Template Functions
  Instead of a templating library (Handlebars, Mustache),
  we use template literals (backtick strings) with ${}
  interpolation. This is clean enough for our use case
  and requires no extra dependencies.

  EMBU FOCUS:
  This app is now focused on student housing in Embu,
  specifically areas near University of Embu. There is
  no city switcher — all listings are in Embu.
*/


/**
 * Show a loading spinner while data is being fetched.
 * The CSS .loading class styles this as centred italic text.
 */
function renderLoading() {
    return '<div class="loading">Loading...</div>';
}

/**
 * Show an error message when something goes wrong.
 *
 * @param {string} message - The error description
 */
function renderError(message) {
    return `<div class="error-state"><h3>Something went wrong</h3><p>${message}</p></div>`;
}

/**
 * Render a single listing card.
 * This is the reusable component used on both the
 * home page (featured listings) and the browse page.
 *
 * @param {object} listing - A listing object from the API
 * @returns {string} - HTML string for one card
 */
function renderCard(listing) {
    const imgStyle = listing.images
        ? `style="background-image: url('${imageUrl(listing.images.split(',')[0])}');"`
        : '';
    const imgContent = listing.images
        ? ''
        : '<div class="placeholder-img">🏠</div>';
    const verified = listing.verified
        ? '<span class="verified-badge">✓ Verified</span>'
        : '';
    const typeLabel = {
        bedsit: 'Bedsit',
        single_room: 'Single Room',
        one_bedroom: '1-Bedroom'
    }[listing.listing_type] || listing.listing_type;

    const amenities = listing.amenities
        ? listing.amenities.split(',').map(a => `<span class="amenity">${a.trim()}</span>`).join('')
        : '';

    // NOTE: listing.city is always "Embu" for this app,
    // so we only show the area name in the location line.
    return `
        <div class="card" onclick="navigate('#/listing/${listing.id}')">
            <div class="card-img" ${imgStyle}>
                ${imgContent}
                ${verified}
            </div>
            <div class="card-content">
                <div class="price">KSh ${listing.price.toLocaleString()} / month</div>
                <div class="title">${listing.title}</div>
                <div class="location">📍 ${listing.area}, ${listing.city}</div>
                <div class="amenities">${amenities}</div>
            </div>
        </div>
    `;
}

/**
 * Render the Home page (Embu Edition).
 * Shows:
 *   1. Hero section with search bar — Embu-specific messaging
 *   2. Area grid — clickable cards for each neighbourhood
 *   3. Featured listings — first 6 from all Embu listings
 */
function renderHome() {
    const areas = AppState.areas;
    const listings = AppState.listings.slice(0, 6); // only first 6

    /*
      Generate the area grid HTML.
      Each area card navigates to #/browse?area=AreaName
      so students can see all listings in that neighbourhood.
    */
    const areaCards = areas.length
        ? areas.map(a => `
            <div class="city-card" onclick="navigate('#/browse?area=${encodeURIComponent(a.name)}')">
                <div class="icon">📍</div>
                <div class="name">${a.name}</div>
                <div class="count">${a.count} listing${a.count !== 1 ? 's' : ''}</div>
            </div>
        `).join('')
        : '<p>No areas yet. Be the first to list!</p>';

    const featuredListings = listings.length
        ? listings.map(renderCard).join('')
        : '<div class="empty-state">No listings yet. Check back soon!</div>';

    return `
        <section class="hero">
            <h2>Find Student Housing Near University of Embu</h2>
            <p>Verified bedsits, single rooms, and apartments in Embu town and surrounding areas.</p>
            <div class="search-container">
                <input type="text" id="home-search" placeholder="Search by area or estate name..." onkeydown="if(event.key==='Enter') doHomeSearch()">
                <button onclick="doHomeSearch()">Search</button>
            </div>
        </section>
        <div class="container">
            <h3 style="margin-bottom:1rem;">Browse by Area</h3>
            <div class="city-grid">${areaCards}</div>
            <h3 style="margin-bottom:1rem;">Featured Listings</h3>
            <div class="listings-grid">${featuredListings}</div>
        </div>
    `;
}

/**
 * Handle the home page search button.
 * Reads the search input and navigates to browse with the query.
 */
function doHomeSearch() {
    const q = document.getElementById('home-search')?.value.trim();
    if (q) {
        navigate(`#/browse?search=${encodeURIComponent(q)}`);
    }
}

/**
 * Render the Browse page (Embu Edition).
 * Shows listings filtered by area, type, and price range.
 *
 * FILTERS AVAILABLE:
 * - Area: Any area, or a specific neighbourhood
 * - Type: Bedsit, Single Room, 1-Bedroom, or All
 * - Price: Ranges (Under 5K, 5-8K, 8K+) or Any
 * - Search: Text search across title, description, area
 */
function renderBrowse() {
    const listings = AppState.listings;
    const activeType = AppState.filters.listing_type;
    const activeSearch = AppState.filters.search || '';
    const activeMin = AppState.filters.min_price;
    const activeMax = AppState.filters.max_price;
    const activeArea = AppState.currentArea;

    // Page title changes based on whether an area is selected
    const title = activeArea
        ? `Listings in ${activeArea}`
        : 'All Listings in Embu';

    // Define available filter options
    const filterTypes = [
        { key: null, label: 'All' },
        { key: 'bedsit', label: 'Bedsits' },
        { key: 'single_room', label: 'Single Rooms' },
        { key: 'one_bedroom', label: '1-Bedroom' },
    ];

    const priceRanges = [
        { min: null, max: null, label: 'Any Price' },
        { min: null, max: 5000, label: 'Under KSh 5,000' },
        { min: 5000, max: 8000, label: 'KSh 5,000 - 8,000' },
        { min: 8000, max: null, label: 'KSh 8,000+' },
    ];

    // Type filter buttons
    const typeFilters = filterTypes.map(t => {
        const active = t.key === activeType ? 'active' : '';
        return `<button class="filter-tag ${active}" onclick="setFilter('listing_type', '${t.key || ''}')">${t.label}</button>`;
    }).join('');

    // Price filter buttons
    const priceFilters = priceRanges.map(p => {
        const active = p.min === activeMin && p.max === activeMax ? 'active' : '';
        return `<button class="filter-tag ${active}" onclick="setPriceFilter(${p.min ?? 'null'}, ${p.max ?? 'null'})">${p.label}</button>`;
    }).join('');

    const listingsHtml = listings.length
        ? listings.map(renderCard).join('')
        : '<div class="empty-state">No listings match your filters. Try adjusting them!</div>';

    return `
        <div class="container">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
                <h2>${title}</h2>
                <a href="#/add" onclick="navigate('#/add')" style="font-weight:600;">+ List Your Room</a>
            </div>
            <div class="filters">
                <span>Type:</span>${typeFilters}
            </div>
            <div class="filters">
                <span>Price:</span>${priceFilters}
            </div>
            ${activeSearch ? `<p style="margin-bottom:1rem;color:#666;">Search results for: <strong>"${activeSearch}"</strong></p>` : ''}
            <div class="listings-grid">${listingsHtml}</div>
        </div>
    `;
}

/**
 * Render the Listing Detail page.
 * Shows full information for a single listing:
 * - Large image, price, title, location, verified badge
 * - Metadata grid (type, landlord, date)
 * - Description and amenities
 * - Contact form for the student to message the landlord
 */
function renderDetail() {
    const l = AppState.currentListing;
    if (!l) return renderError('Listing not found.');

    const imgStyle = l.images
        ? `style="background-image: url('${imageUrl(l.images.split(',')[0])}');"`
        : '';
    const imgContent = l.images
        ? ''
        : '<div class="placeholder-img">🏠</div>';
    const verified = l.verified
        ? '<span class="verified-badge" style="font-size:0.85rem;">✓ Verified</span>'
        : '';

    const typeLabel = {
        bedsit: 'Bedsit',
        single_room: 'Single Room',
        one_bedroom: '1-Bedroom'
    }[l.listing_type] || l.listing_type;

    const amenities = l.amenities
        ? l.amenities.split(',').map(a => `<span class="amenity">${a.trim()}</span>`).join('')
        : '<p style="color:#888;">No amenities listed.</p>';

    const description = l.description || 'No description provided.';

    /*
      Contact form — built into the detail page.
      When submitted, it calls submitContact() from router.js
      via the onsubmit attribute. The listing ID is passed
      so the backend knows which landlord to notify.
    */
    const contactForm = `
        <div class="contact-section">
            <h3>Contact Landlord</h3>
            <form id="contact-form" onsubmit="submitContact(event, ${l.id})">
                <div class="form-group">
                    <label>Your Name</label>
                    <input type="text" id="contact-name" required placeholder="e.g. John Kimani">
                </div>
                <div class="form-group">
                    <label>Your Phone Number</label>
                    <input type="tel" id="contact-phone" required placeholder="e.g. 0712345678">
                </div>
                <div class="form-group">
                    <label>Message (optional)</label>
                    <textarea id="contact-msg" placeholder="Hi, I'm interested in this room. Is it still available?"></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Send Enquiry</button>
            </form>
            <div id="contact-result" style="margin-top:1rem;"></div>
        </div>
    `;

    return `
        <div class="detail-container">
            <div class="back-link" onclick="navigate('#/browse${AppState.currentArea ? '?area=' + encodeURIComponent(AppState.currentArea) : ''}")">← Back to listings</div>
            <div class="detail-card">
                <div class="detail-img" ${imgStyle}>${imgContent}</div>
                <div class="detail-body">
                    <div class="price">KSh ${l.price.toLocaleString()} / month</div>
                    <div class="title">${l.title}</div>
                    <div class="location">📍 ${l.area}, ${l.city} ${verified}</div>
                    <div class="detail-meta">
                        <div class="meta-item"><div class="label">Type</div><div class="value">${typeLabel}</div></div>
                        <div class="meta-item"><div class="label">Landlord</div><div class="value">${l.landlord_name}</div></div>
                        <div class="meta-item"><div class="label">Listed</div><div class="value">${new Date(l.created_at).toLocaleDateString()}</div></div>
                    </div>
                    <div class="description">${description}</div>
                    <h4 style="margin-bottom:0.5rem;">Amenities</h4>
                    <div class="amenities-list">${amenities}</div>
                    ${contactForm}
                </div>
            </div>
        </div>
    `;
}

/**
 * Helper: generate area <option> tags from AppState.areas
 * with a hardcoded fallback if areas haven't been loaded.
 *
 * @param {string} selected - Currently selected area name (or empty)
 * @returns {string} - HTML option elements
 */
function getAreaOptions(selected) {
    const areas = AppState.areas;
    if (areas.length) {
        return areas.map(a =>
            `<option value="${a.name}"${a.name === selected ? ' selected' : ''}>${a.name}</option>`
        ).join('');
    }
    const fallback = ['Gakwegori','Kangaru','Njukiri','Iveche','Kamiu','Koimugo','Town','Karurumo','Kanyakumu','Kianjokoma'];
    return fallback.map(a =>
        `<option value="${a}"${a === selected ? ' selected' : ''}>${a}</option>`
    ).join('');
}

/**
 * Render the Add Listing form (Embu Edition).
 * Since the app is Embu-focused:
 * - The city field is hidden (always "Embu")
 * - The area field is a dropdown of known neighbourhoods
 * Landlords submit rooms with photos via multipart/form-data.
 */
function renderAddListing() {
    return `
        <div class="form-container">
            <h2>List Your Room in Embu</h2>
            <p style="margin-bottom:1.5rem;color:#666;">Fill in the details below. Rooms with photos and verifications get more views from University of Embu students.</p>
            <form id="add-listing-form" onsubmit="submitListing(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Title *</label>
                        <input type="text" id="add-title" required placeholder="e.g. Modern Tiled Bedsit">
                    </div>
                    <div class="form-group">
                        <label>Price (KSh) *</label>
                        <input type="number" id="add-price" required min="1" placeholder="e.g. 4500">
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="add-description" rows="3" placeholder="Describe the room, location, nearby amenities..."></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Area / Estate *</label>
                        <select id="add-area" required>
                            <option value="">Select area...</option>
                            ${getAreaOptions()}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Type *</label>
                        <select id="add-type" required>
                            <option value="">Select type...</option>
                            <option value="bedsit">Bedsit</option>
                            <option value="single_room">Single Room</option>
                            <option value="one_bedroom">1-Bedroom</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Amenities</label>
                    <input type="text" id="add-amenities" placeholder="e.g. Wi-Fi, Inside Water, Gated Security">
                </div>
                <div class="form-group">
                    <label>Photos</label>
                    <input type="file" id="add-images" accept="image/*" multiple>
                </div>

                <!-- City is hidden because this app is Embu-only -->
                <input type="hidden" id="add-city" value="Embu">

                <hr style="margin:1.5rem 0;border:none;border-top:1px solid #eee;">
                <h4 style="margin-bottom:1rem;">Your Contact Details</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Your Name *</label>
                        <input type="text" id="add-landlord-name" required placeholder="e.g. Jane Wanjiku">
                    </div>
                    <div class="form-group">
                        <label>Phone Number *</label>
                        <input type="tel" id="add-landlord-phone" required placeholder="e.g. 0712345678">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top:1rem;">Submit Listing</button>
            </form>
            <div id="add-result" style="margin-top:1rem;"></div>
        </div>
    `;
}

/**
 * Render the About / Help page.
 * A static page with information for students and landlords.
 */
function renderAbout() {
    return `
        <div class="about-container">
            <div class="about-card">
                <h2>🏡 About CampusHaven KE</h2>
                <p>CampusHaven KE helps University of Embu students find safe, affordable, and verified housing near campus. We focus on Embu town and surrounding areas — from Gakwegori to Kangaru, Njukiri to Town.</p>
                <p>We partner with trusted landlords and verify listings so you can focus on your studies, not your housing.</p>
            </div>
            <div class="about-card">
                <h2>🛡️ Safety Tips for Students</h2>
                <ul>
                    <li><strong>Always view the room in person</strong> or request a video tour before paying anything.</li>
                    <li><strong>Never pay</strong> a deposit before viewing the property.</li>
                    <li><strong>Get a written agreement</strong> — a simple contract protects both you and the landlord.</li>
                    <li><strong>Check the neighbourhood</strong> — visit during the day and evening to assess safety.</li>
                    <li><strong>Ask about utilities</strong> — water, electricity, and Wi-Fi costs can add up.</li>
                    <li><strong>Share your location</strong> — let a friend or family member know where you're moving.</li>
                </ul>
            </div>
            <div class="about-card">
                <h2>👨‍👩‍👧‍👦 For Landlords</h2>
                <p>Have a room near University of Embu? List it for free on CampusHaven KE and reach thousands of students actively looking for housing.</p>
                <p><a href="#/add" onclick="navigate('#/add')">List your room now →</a></p>
            </div>
            <div class="about-card">
                <h2>📞 Contact Us</h2>
                <p>Have feedback or need help? Reach out to us at <strong>help@campushaven.co.ke</strong></p>
            </div>
        </div>
    `;
}

/**
 * Render the Admin Dashboard.
 * Shows:
 *   1. Stats cards (total, verified, areas)
 *   2. Area management (add/remove areas)
 *   3. Edit form (if a listing is selected for editing)
 *   4. Full listings table with management actions
 */
function renderAdmin() {
    const listings = AppState.listings;
    const areas = AppState.areas;
    const editId = AppState.editingListingId;
    const editListing = editId ? listings.find(l => l.id === editId) : null;

    // Stats calculations
    const totalListings = listings.length;
    const verifiedCount = listings.filter(l => l.verified).length;
    const areaCount = areas.length;

    // Stats cards row
    const statsHtml = `
        <div class="admin-stats">
            <div class="admin-stat-card">
                <span class="admin-stat-number">${totalListings}</span>
                <span class="admin-stat-label">Total Listings</span>
            </div>
            <div class="admin-stat-card">
                <span class="admin-stat-number">${verifiedCount}</span>
                <span class="admin-stat-label">Verified</span>
            </div>
            <div class="admin-stat-card">
                <span class="admin-stat-number">${areaCount}</span>
                <span class="admin-stat-label">Areas</span>
            </div>
        </div>
    `;

    // Area breakdown badges
    const areaBadges = areas.length
        ? areas.map(a => `<span class="admin-area-badge">${a.name}: ${a.count}</span>`).join('')
        : '<span style="color:#888;">No areas found.</span>';

    // Area management section (add / remove areas)
    const areaManagementHtml = `
        <div class="admin-section">
            <h3>Manage Areas</h3>
            <p class="admin-hint">Areas are the neighbourhoods that appear in the add-listing dropdown. To add a new area, type a name and click "Add Area". To delete an area, click ✕ — only empty areas (0 listings) can be deleted.</p>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;">
                ${areas.length
                    ? areas.map(a => `
                        <div class="admin-area-item">
                            <span>${a.name} (${a.count})</span>
                            <button class="btn btn-xs btn-danger" onclick="deleteArea(${a.id})" ${a.count > 0 ? 'disabled title="Cannot delete: ${a.count} listing(s) use this area"' : 'title="Delete area"'}>✕</button>
                        </div>
                    `).join('')
                    : '<span style="color:#888;">No areas. Add one below.</span>'
                }
            </div>
            <form onsubmit="event.preventDefault(); addArea()" style="display:flex;gap:0.5rem;max-width:400px;">
                <input type="text" id="admin-new-area-name" placeholder="New area name (e.g. Ruguru)" required style="flex:1;padding:0.5rem;border:1px solid #ddd;border-radius:4px;">
                <button type="submit" class="btn btn-primary btn-sm">Add Area</button>
            </form>
            <div id="admin-area-result" style="margin-top:0.5rem;"></div>
        </div>
    `;

    // Images for the listing being edited
    const editImagesHtml = editListing && editListing.images
        ? `<div style="margin-bottom:0.8rem;">
            <label style="font-weight:600;font-size:0.9rem;display:block;margin-bottom:0.3rem;">Current Images</label>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                ${editListing.images.split(',').map(f =>
                    f.trim() ? `<img src="${imageUrl(f.trim())}" style="width:100px;height:75px;object-fit:cover;border-radius:4px;border:1px solid #ddd;">` : ''
                ).join('')}
            </div>
            <span style="font-size:0.8rem;color:#888;">To change images, delete and re-create the listing.</span>
        </div>`
        : '';

    // Edit form (shown when a listing is selected for editing)
    const editFormHtml = editListing ? `
        <div class="admin-edit-panel">
            <h3>Editing: ${editListing.title}</h3>
            <form id="admin-edit-form" onsubmit="event.preventDefault(); saveEdit(${editListing.id})">
                ${editImagesHtml}
                <div class="form-row">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="admin-edit-title" value="${editListing.title.replace(/"/g, '&quot;')}" required>
                    </div>
                    <div class="form-group">
                        <label>Price (KSh)</label>
                        <input type="number" id="admin-edit-price" value="${editListing.price}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Area</label>
                        <select id="admin-edit-area">
                            ${getAreaOptions(editListing.area)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="admin-edit-type">
                            ${['bedsit','single_room','one_bedroom']
                                .map(t => `<option value="${t}"${t === editListing.listing_type ? ' selected' : ''}>${t.replace('_', ' ')}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Landlord Name</label>
                        <input type="text" id="admin-edit-landlord-name" value="${editListing.landlord_name.replace(/"/g, '&quot;')}">
                    </div>
                    <div class="form-group">
                        <label>Landlord Phone</label>
                        <input type="text" id="admin-edit-landlord-phone" value="${editListing.landlord_phone.replace(/"/g, '&quot;')}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Amenities (comma-separated)</label>
                    <input type="text" id="admin-edit-amenities" value="${editListing.amenities.replace(/"/g, '&quot;')}">
                </div>
                <div class="form-group">
                    <label style="display:flex;align-items:center;gap:0.5rem;">
                        <input type="checkbox" id="admin-edit-verified"${editListing.verified ? ' checked' : ''}>
                        Verified listing
                    </label>
                </div>
                <div style="display:flex;gap:0.5rem;margin-top:1rem;">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                    <button type="button" class="btn" onclick="cancelEdit()">Cancel</button>
                </div>
            </form>
        </div>
    ` : '';

    // Build the listings table
    const tableRows = listings.length
        ? listings.map(l => {
            const isEditing = l.id === editId;
            const rowClass = isEditing ? 'admin-row-editing' : '';
            const verifiedLabel = l.verified
                ? '<span style="color:#2E7D32;font-weight:600;">✓ Yes</span>'
                : '<span style="color:#999;">✗ No</span>';
            return `
                <tr class="${rowClass}">
                    <td>${l.id}</td>
                    <td>${l.title}</td>
                    <td>${l.area}</td>
                    <td>KSh ${l.price.toLocaleString()}</td>
                    <td>${l.listing_type}</td>
                    <td>${l.landlord_name}</td>
                    <td>${verifiedLabel}</td>
                    <td class="admin-actions">
                        <button class="btn btn-sm" onclick="editListing(${l.id})">✎ Edit</button>
                        <button class="btn btn-sm ${l.verified ? 'btn-warning' : 'btn-primary'}" onclick="toggleVerify(${l.id}, ${l.verified})">
                            ${l.verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteListing(${l.id})">✕ Delete</button>
                    </td>
                </tr>
            `;
        }).join('')
        : '<tr><td colspan="8" style="text-align:center;color:#888;">No listings found.</td></tr>';

    return `
        <div class="admin-container">
            <h2>Admin Dashboard</h2>
            <div class="admin-section admin-intro">
                <p>Manage listings and areas on CampusHaven KE. Use the table below to edit, verify, or delete listings. Use the <strong>Manage Areas</strong> section to add or remove neighbourhoods — new areas appear immediately in the add-listing form dropdown.</p>
            </div>
            ${statsHtml}
            ${areaManagementHtml}
            ${editFormHtml}
            <div class="admin-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Area</th>
                            <th>Price</th>
                            <th>Type</th>
                            <th>Landlord</th>
                            <th>Verified</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        </div>
    `;
}
