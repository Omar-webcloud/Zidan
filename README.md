# Zidan Sharma Portfolio

Premium static portfolio website with an `/admin` panel for editing section copy, projects, images, videos, and media.

## Files

- `index.html` — public portfolio
- `style.css` — public site styles
- `script.js` — public site interactions and Firebase hydration
- `admin/index.html` — admin panel at `/admin/`
- `admin/admin.css` — admin styles
- `admin/admin.js` — admin login, editing, and upload logic
- `firebase-config.js` — Firebase and imageDb configuration
- `firebase-client.js` — Firebase Auth, Firestore, and Storage helpers
- `site-data.js` — fallback content used before Firebase is configured

## Firebase Setup

1. Create a Firebase project.
2. Enable Authentication with Email/Password.
3. Create the admin user in Firebase Authentication.
4. Enable Firestore Database.
5. Enable Cloud Storage for Firebase.
6. Paste your web app config into `firebase-config.js`.
7. Deploy the site with Firebase Hosting, Netlify, Vercel, or any static host.

The code names Firebase Storage as `imageDb`, matching the requested media storage role. Uploaded images and videos are saved under:

```text
zidan-portfolio/media
```

## Suggested Firestore Rules

Replace `ADMIN_UID_HERE` with the Firebase Auth UID of the admin account.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.uid == "ADMIN_UID_HERE";
    }

    match /site/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /projects/{projectId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

## Suggested Storage Rules

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null && request.auth.uid == "ADMIN_UID_HERE";
    }

    match /zidan-portfolio/media/{fileName} {
      allow read: if true;
      allow write: if isAdmin()
        && request.resource.size < 50 * 1024 * 1024
        && request.resource.contentType.matches('image/.*|video/.*');
    }
  }
}
```

## Admin URL

Open:

```text
/admin/
```

After signing in, you can edit section titles, contact details, projects, featured status, category filters, placeholder art style, media URL, and uploaded image/video files.
