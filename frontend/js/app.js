/*
  =====================================================
  app.js — Application Entry Point
  =====================================================
  This is the first code that runs when the page loads.
  It does two simple but important things:

  1. Listen for hash changes (user clicks a link)
  2. Run the router on initial page load

  WHY IS THIS SEPARATE FROM router.js?
  This is the "init" or "boot" file. It's deliberately
  small because app.js should only handle startup logic.
  If we later add other startup tasks (like checking auth,
  loading user preferences, etc.), they go here without
  cluttering the router code.

  EVENT LISTENERS:
  window.addEventListener('hashchange', router)
  - Fires every time the URL hash changes
  - When user clicks a link with onclick="navigate('#/browse')",
    the hash changes → hashchange fires → router runs

  window.addEventListener('DOMContentLoaded', router)
  - Fires when the HTML has loaded (but before images/styles
    have fully loaded). This is earlier than window.onload.
  - Without this, the page would be blank until the user
    manually clicks something, because the router only
    runs on hashchange events.
  - On first load, there may be no hash, so getRouteParams()
    returns path: "/" which loads the home page.
*/

/*
  DOMContentLoaded fires when the browser has finished
  parsing the HTML document. At this point all our script
  tags have loaded (api.js, state.js, render.js, router.js)
  and we can safely call router() to render the initial page.
*/
window.addEventListener('DOMContentLoaded', router);

/*
  hashchange fires whenever the URL hash changes.
  This is how our SPA handles navigation without page reloads.
  When a user clicks a nav link or searches, the hash changes,
  and the router runs again to swap the content.
*/
window.addEventListener('hashchange', router);
