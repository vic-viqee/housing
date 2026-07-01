/*
  =====================================================
  state.js — Application State (Global Data Store)
  =====================================================
  This is a simple global object that holds the current
  state of the application. It's like a mini "store"
  (similar to Redux or Vuex, but much simpler).

  WHY DO WE NEED STATE?
  Different parts of the app need to share data:
  - The router fetches listings and stores them here
  - The render functions read listings from here
  - Filter selections persist here across page navigations

  Without this, we'd have to pass data around as function
  arguments everywhere, or re-fetch from the API on every
  page render. State makes data sharing clean.

  PATTERN: Singleton
  This is a singleton — one object available globally.
  Every JS file after state.js can access AppState.
  This works because of the script loading order in index.html.

  NOTE: This app is Embu-focused. The city is always "Embu"
  and we use `currentArea` to filter by neighborhood.
*/

const AppState = {
    // Currently selected area (null means "all areas")
    // Since the app is Embu-focused, there is no city switcher.
    currentArea: null,

    // The listing currently being viewed on the detail page
    currentListing: null,

    // All listings fetched from the API (filtered results)
    listings: [],

    // Available areas within Embu with listing counts (from /api/areas)
    areas: [],

    // ID of the listing currently being edited in the admin page (null = not editing)
    editingListingId: null,

    // Current filter selections
    filters: {
        listing_type: null,   // "bedsit", "single_room", "one_bedroom", or null
        min_price: null,      // number or null
        max_price: null,      // number or null
        search: null,         // search query string or null
    },
};
