# UniThrift

UniThrift is a student-only mobile marketplace designed for University of Hong Kong (HKU) students. It allows students to buy, sell, rent, and donate items safely within the campus community. The app promotes affordability, trust, and sustainability by encouraging item reuse.

## Overview

Every year, students move in and out of HKU, creating a constant need for dorm essentials, books, electronics, and other items. UniThrift provides a secure and verified platform where HKU students can exchange items easily and locally, helping reduce waste, save money, and encourage reuse of items within the student community.

## Features

- HKU student-only access using `@connect.hku.hk` email verification  
- Buy, sell, rent, or donate items  
- Browse listings by category, keyword search, or map view  
- Location-based item discovery using Google Maps  
- Create, edit, and delete listings  
- Real-time in-app chat between buyers and sellers  
- QR code-based meetup confirmation  
- Secure Stripe-powered payments  
- User profile management  

## Installation

### Install APK (Android)

1. Download the APK file from this repository.
2. Transfer the APK to your Android device.
3. Open the APK file and allow installation from unknown sources if prompted.
4. Install and launch the app.
5. Sign up with a valid HKU email or log in using the test accounts below.


## Test Accounts

### Seller Account
- **Email:** seller@connect.hku.hk  
- **Password:** password  

### Buyer Account
- **Email:** user@connect.hku.hk  
- **Password:** password  


## How to Use

1. Sign up or log in with an HKU email address.
2. Browse items from the home page or map view.
3. Create a post to sell, rent, or donate an item.
4. Use in-app chat to arrange details with other students.
5. Scan the QR code at the meetup to confirm the transaction.
6. Complete payment securely through Stripe (if applicable).


## Tech Stack

- React Native (Expo)
- Firebase Authentication
- Firebase Firestore (used for posts, users, and chat storage)
- Firebase Cloud Storage (image uploads)
- Gifted Chat UI for real-time in-app messaging
- Expo QR Code for QR code generation
- Expo Camera for QR code scanning and meetup verification
- Google Maps & Places API for location-based discovery
- Stripe Payments for secure sales and rental transactions
