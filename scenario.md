# User Scenarios — CampusHaven KE (Embu Edition)

## Scenario 1: Student Looking for Housing

**Persona**: Faith, 2nd-year student at University of Embu

### Flow

1. **Landing** — Faith opens the site and sees the hero: "Find Your Student Room in Embu" with a search bar and area grid (Gakwegori, Kangaru, Njukiri, etc.)

2. **Browse by area** — Faith clicks "Kangaru" (an area near campus she's interested in). The URL changes to `#/browse?area=Kangaru`.

3. **Filter results** — The browse page shows all Kangaru listings. Faith clicks "Bedsit" filter, then selects price range "3,000–6,000". The page refreshes to show only bedsits in Kangaru within her budget.

4. **View a listing** — She clicks on "Spacious Bedsit near Kangaru Market" (`#/listing/5`). The detail page shows:
   - A large photo
   - Price: KSh 4,500/month
   - Location: Kangaru, Embu
   - Verified badge (green)
   - Type: Bedsit
   - Landlord: Jane Wanjiku
   - Amenities: Wi-Fi, Inside Water, Gated Security
   - Full description
   - Contact form

5. **Contact landlord** — Faith fills in her name (Faith Kemunto), phone (0712345678), and a message ("Hi, is this room still available? I'd like to view it today."). She clicks "Send Enquiry".

6. **Response** — The form shows a success message displaying the landlord's phone number. Faith calls to arrange a viewing.

---

## Scenario 2: Landlord Listing a Room

**Persona**: Mr. Omondi, a landlord with a bedsit near University of Embu Gate A

### Flow

1. **Landing** — Mr. Omondi opens the site. He sees the homepage with area listings and the navigation bar.

2. **Navigate to add form** — He clicks "List Your Room" in the nav. The URL changes to `#/add`.

3. **Fill in listing details** — He fills out the form:
   - Title: "Tiled Bedsit near Gate A"
   - Description: "5 minutes from Uni... quiet compound..."
   - Price: 4,500
   - Area: Gakwegori (selects from dropdown)
   - Type: Bedsit
   - Amenities: "Inside Water, Token Meter, Wi-Fi"
   - Photos: Uploads 3 images of the room

4. **Contact details** — He enters his name (Peter Omondi) and phone (0722123456). The city field is hidden (always "Embu").

5. **Submit** — He clicks "Submit Listing". The form is sent as `multipart/form-data` to `POST /api/listings`.

6. **Success** — A green alert appears: "Listing submitted successfully! It will appear on the platform shortly."

7. **Listing goes live** — His room immediately appears in the Gakwegori area on the home page and browse page.

8. **Receives enquiries** — When a student fills the contact form on his listing, the system returns his phone number to the student, and the student calls him directly.

---

## Admin Flow

**Persona**: Platform admin managing listings

### Flow

1. **Access admin** — Admin clicks "Admin" in the nav or goes to `#/admin`.

2. **Dashboard overview** — Sees stats cards: total listings, verified count, number of areas. Area breakdown badges show counts per neighbourhood.

3. **Review listings** — Full table shows all listings: ID, Title, Area, Price, Type, Landlord, Verified status.

4. **Verify a listing** — Clicks "Verify" on a new listing. The verified status toggles to Yes (green), and the listing shows a verified badge on the front end.

5. **Edit a listing** — Clicks "Edit" on a listing. An edit panel appears at the top with pre-filled fields (title, price, area, type, landlord name/phone, amenities, verified checkbox). Changes the price from 5,000 to 4,500, clicks "Save Changes".

6. **Delete a listing** — Clicks "Delete" on an outdated listing. A browser confirm dialog asks "Are you sure you want to delete this listing?" Confirms, and the listing is removed from the database and its images deleted from the server.
