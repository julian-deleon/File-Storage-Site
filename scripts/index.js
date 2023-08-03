import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js'
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-analytics.js'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, setPersistence, browserSessionPersistence, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js'
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js'
import { ref, uploadBytes, getDownloadURL, getStorage } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js'

 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
apiKey: "AIzaSyAWeULOa3W4zyo0XNYrUF33ciRDt_-egho",
authDomain: "music-playlist-1d889.firebaseapp.com",
projectId: "music-playlist-1d889",
storageBucket: "music-playlist-1d889.appspot.com",
messagingSenderId: "315313549422",
appId: "1:315313549422:web:911ac3d83729e8211e767f",
measurementId: "G-11N0508Z2W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
//const db = firebase.firestore();

// Set session cookie support
auth.setPersistence(browserSessionPersistence);

// get reference to signup-form and buttons
const signupForm = document.querySelector('#signup-form');
const signupButton = document.querySelector('#signup-button');
const loginButton = document.querySelector('#login-button');

//get user inputs
const emailInput = document.querySelector('#signup-email');
const passwordInput = document.querySelector('#signup-password');

if (signupButton)
{
  signupButton.addEventListener('click', (e) => {
      e.preventDefault();

      const email = emailInput.value;
      const password = passwordInput.value;

      console.log(email, password)

      createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
          // Signed in 
          const user = userCredential.user;
          // ...
      })
      .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          // ..
      });
  });
}

// Function to handle user login using session cookies
async function loginUser(email, password) {
  try {
    // Sign in the user using session cookies
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    window.location.href = 'home.html'
    
    console.log('User logged in:', user);
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

if (loginButton) {
  loginButton.addEventListener('click', async (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    // Call the login function with the provided email and password
    await loginUser(email, password);
  });
}

// Use onAuthStateChanged() to handle user authentication changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // If the user is logged in, get their UID and display songs from Firestore
    const userID = user.uid; 
    console.log("user", user)
    currentUser.innerHTML = "Logged in email: " + user.email
    displaySongsFromFirestore(userID);
  } else {
    // If the user is logged out, clear the song list
    songList.innerHTML = '';
  }
});


const signoutButton = document.querySelector('#signout-button');

if (signoutButton)
{
  signoutButton.addEventListener('click', (e) => {
      e.preventDefault();
    
      // Call the signOut() method to sign out the user
      signOut(auth)
        .then(() => {
          // User signed out successfully
          console.log('User signed out');
    
          // Redirect to sign-in page or any other desired page
          window.location.href = 'index.html';
        })
        .catch((error) => {
          // Handle errors
          console.log(`Sign out error: ${error.message}`);
        });
    });
}

// HOME PAGE

// Get references to HTML elements
const playlistForm = document.getElementById('playlist-form');
const songInput = document.getElementById('song-input');
const artistInput = document.getElementById('description-input');
const imageInput = document.getElementById('image-input');
const currentUser = document.getElementById('logged-in-user');
const songList = document.getElementById('song-list') || document.createElement('div');


// Function to add a new item to the todo list and save it to Firebase Firestore
function addItem(event) {
  event.preventDefault(); // Prevent form submission

  const Name = songInput.value.trim();
  const Artist = artistInput.value.trim();
  const image = imageInput.files[0]; // Get the selected image file

  if (Name !== '') {
    // Get currently authenticated user
    const user = auth.currentUser;
    
    if (user) {
      // Step 1: Upload the file to Firebase Storage
      const storageRef = ref(storage, 'images/' + image.name);
      uploadBytes(storageRef, image)
        .then((snapshot) => {
          // Step 2: Get the download URL for the uploaded file
          getDownloadURL(snapshot.ref)
            .then((downloadURL) => {
              // Create the todo item object with the file URL
              const songItem = {
                Name: Name,
                Artist: Artist,
                userID: user.uid,
                imageURL: downloadURL // Store the download URL in Firestore
              };

              console.log(songItem);
          
              // Save the todo item to Firebase Firestore
              addDoc(collection(db, 'songs'), songItem)
                .then((docRef) => {
                  // Document successfully written to Firestore
                  const songItemId = docRef.id;
                  
                  // Reset form inputs
                  playlistForm.reset();
                })
                .catch((error) => {
                  // Handle Firestore save error
                  console.error('Error adding todo item: ', error);
                });
            })
            .catch((error) => {
              // Handle getting the download URL error
              console.error('Error getting download URL: ', error);
            });
        })
        .catch((error) => {
          // Handle file upload error
          console.error('Error uploading file: ', error);
        });
    }
  }
}

// Function to create an HTML template for each song item
function createSongItemTemplate(songItem) {
  const fileIcon = getFileIcon(songItem.imageURL); // Function to get the appropriate file icon

  return `
    <div class="song-item">
      <p>${songItem.Name} | ${songItem.Artist}</p> 
      <div class="file-icon">${fileIcon}</div>
      <a href="${songItem.imageURL}" download>Download</a>
    </div>
  `;
}

// Function to display icon for the uploaded file or an image preview if it is an image
function getFileIcon(fileURL) {
  // Regular expression to extract file extension
  const extensionPattern = /\.([0-9a-z]+)(?:\?|$)/i;
  const match = fileURL.match(extensionPattern);
  if (match && match[1]) {
    const fileExtension = match[1].toLowerCase();

    // List of supported image file extensions
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

    // Check if the file is an image
    if (imageExtensions.includes(fileExtension)) {
      return `<img src="${fileURL}" alt="Image Preview" width="50" height="50">`;
    } else {
      // Replace this switch statement with appropriate mappings for your other file types
      switch (fileExtension) {
        case 'pdf':
          return '<i class="fas fa-file-pdf"></i>';
        case 'doc':
        case 'docx':
          return '<i class="fas fa-file-word"></i>';
        case 'xls':
        case 'xlsx':
          return '<i class="fas fa-file-excel"></i>';
        // Add more cases for other file types
        default:
          return '<i class="fas fa-file"></i>'; // Default icon for unknown file types
      }
    }
  }

  return ''; // Return empty string if fileURL is invalid
}

// Function to update the song list in the HTML
function updateSongList(songItems) {
  songList.innerHTML = ''; // Clear the existing song list before updating
  songItems.forEach((songItem) => {
    const songItemTemplate = createSongItemTemplate(songItem);
    songList.innerHTML += songItemTemplate;
  });
}

function displaySongsFromFirestore(userID) {
  console.log('UserID:', userID); // Check the value of userID here

  // Reference to the 'songs' collection in Firestore
  const songsCollection = collection(db, 'songs');

  // Create a query to filter the songs based on the user's UID
  const userSongsQuery = query(songsCollection, where('userID', '==', userID));

  // Create a real-time listener using onSnapshot for the user-specific songs
  onSnapshot(userSongsQuery, (querySnapshot) => {
    const songItems = [];
    querySnapshot.forEach((doc) => {
      const songItem = doc.data();
      songItems.push(songItem);
    });

    console.log('Number of songs fetched:', songItems.length);

    // Update the song list in the HTML
    updateSongList(songItems);
  });
}

// Event listener for form submission
playlistForm.addEventListener('submit', addItem);

export {app, analytics, auth, db}; 

 