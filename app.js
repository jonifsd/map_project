// יצירת המפה עם מרכז זמני
const map = L.map('map').setView([31.0461, 34.8516], 8); // קואורדינטות של ישראל כתוכנית גיבוי

// טעינת המפה באמצעות OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// פונקציה לשמירה של מיקום והערה ב-Local Storage
function saveLocation(lat, lng, note) {
    let locations = JSON.parse(localStorage.getItem('locations')) || [];
    locations.push({ lat, lng, note });
    localStorage.setItem('locations', JSON.stringify(locations));
}

// פונקציה לעדכון הרשימה עם המיקומים ששמרנו
function updateLocationList() {
    const listContainer = document.getElementById('location-list');
    listContainer.innerHTML = ''; // ניקוי הרשימה

    let locations = JSON.parse(localStorage.getItem('locations')) || [];
    locations.forEach((location, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'location-item';
        listItem.textContent = `${index + 1}: ${location.note || "ללא הערה"}`;
        listItem.addEventListener('click', function() {
            map.setView([location.lat, location.lng], 13);
            L.marker([location.lat, location.lng]).addTo(map)
                .bindPopup(location.note || "אין הערה").openPopup();
        });
        listContainer.appendChild(listItem);
    });
}

// פונקציה לטעינת המיקומים מה-Local Storage
function loadLocations() {
    let locations = JSON.parse(localStorage.getItem('locations')) || [];
    locations.forEach(location => {
        L.marker([location.lat, location.lng]).addTo(map)
            .bindPopup(location.note || "אין הערה").openPopup();
    });
    updateLocationList();
}

// טעינת המיקומים מה-Local Storage כאשר הדף נטען
window.addEventListener('load', function() {
    loadLocations();
});

// טיפול בלחיצה על המפה ליצירת סימון
map.on('click', function(e) {
    const coord = e.latlng;
    const lat = coord.lat;
    const lng = coord.lng;

    // בקשה להוספת הערה עם חלון קופץ
    const popupContent = prompt("הכנס הערה למיקום זה:");

    // בדיקה אם המשתמש הכניס הערה או לחיצה על ביטול
    if (popupContent) {
        // שמירת המיקום וההערה ב-Local Storage
        saveLocation(lat, lng, popupContent);

        // הוספת סימון על המפה
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(popupContent).openPopup();

        // עדכון הרשימה עם המיקום החדש
        updateLocationList();
    }
});

// פונקציה לביצוע גיאוקודינג של כתובת
function geocodeAddress(address, note) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = data[0].lat;
                const lng = data[0].lon;
                
                // הוספת הסימון על המפה
                const marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(note || "כתובת: " + address).openPopup();

                // שמירת המיקום וההערה ב-Local Storage
                saveLocation(lat, lng, note);

                // מרכז את המפה לסימון
                map.setView([lat, lng], 13);

                // עדכון הרשימה עם המיקום החדש
                updateLocationList();
            } else {
                alert("לא נמצא מיקום לכתובת זו.");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("שגיאה בחיפוש הכתובת.");
        });
}

// טיפול בלחיצה על כפתור "סמן על המפה"
document.getElementById('geocode-btn').addEventListener('click', function() {
    const address = document.getElementById('address-input').value;
    const note = document.getElementById('note-input').value;
    
    if (address) {
        geocodeAddress(address, note);
    } else {
        alert("אנא הכנס כתובת.");
    }
});

// טיפול בכפתור להצגת והסתרת המפה
document.getElementById('toggle-map-btn').addEventListener('click', function() {
    const mapElement = document.getElementById('map');
    if (mapElement.style.display === 'none') {
        mapElement.style.display = 'block';
        document.getElementById('location-list').style.display = 'block';
        this.textContent = 'הסתר את המפה';
    } else {
        mapElement.style.display = 'none';
        document.getElementById('location-list').style.display = 'none';
        this.textContent = 'הצג את המפה';
    }
});
