# Zidan Portfolio

Premium portfolio website with an `/admin` panel for editing section copy, projects, images, videos, and media.

## Current Backend Setup

- Firebase Authentication: admin login
- Firebase Firestore: section copy and project data
- ImageDB / ImgBB: image uploads
- Video media: paste a hosted video URL into the project `Media URL` field

Firebase Storage is not required.

## Firebase Auth + Firestore

1. Open Firebase Console.
2. Select the `zidan-sharma-portfolio` project.
3. Go to **Build → Authentication → Sign-in method**.
4. Enable **Email/Password**.
5. Go to **Authentication → Users**.
6. Add the admin email/password.
7. Copy the admin user's UID.
8. Go to **Build → Firestore Database**.
9. Create a database in production mode.
10. Open **Firestore Database → Rules**.
11. Paste this rule and replace `YOUR_ADMIN_UID`:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.uid == "YOUR_ADMIN_UID";
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

## ImageDB / ImgBB Setup

1. Create an ImgBB account.
2. Go to the ImgBB API page.
3. Generate an API key.
4. Open `/admin/`.
5. Paste the API key into **ImageDB API Key**.
6. Click **Save ImageDB Key**.

After that, `/admin/` can upload images and automatically place the uploaded image URL into:

- the selected project
- the hero image slot
- about, services, process, experience, statement, contact, or footer media slots
- the Open Graph share image

Videos are still supported by pasting a hosted video URL into the matching media URL field and setting the media type to `video`.

## Admin URL

Open:

```text
/admin/
```

Sign in with the Firebase admin account, then edit content, projects, and every section image from hero to footer.
