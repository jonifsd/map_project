// יצירת המפה עם מרכז זמני
const map = L.map('map').setView([31.0461, 34.8516], 8); // קואורדינטות של ישראל כתוכנית גיבוי

// טעינת המפה באמצעות OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// פונקציה לגיאוקודינג של מיקום (Lat/Lng) לכתובת
function reverseGeocode(lat, lng, callback) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const address = data && data.address ? `${data.address.road || ''}, ${data.address.city || ''}, ${data.address.country || ''}`.trim() : 'כתובת לא ידועה';
            callback(address);
        })
        .catch(error => {
            console.error("Error:", error);
            callback('שגיאה בקבלת הכתובת');
        });
}

// פונקציה לשמירה של מיקום, כתובת והערה ב-Local Storage
function saveLocation(lat, lng, address, note) {
    let locations = JSON.parse(localStorage.getItem('locations')) || [];
    locations.push({ lat, lng, address, note });
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
        listItem.innerHTML = `
            <strong>${index + 1}: ${location.note || "ללא הערה"}</strong><br>
            כתובת: ${location.address || "לא ידוע"}
        `;
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

    // גיאוקודינג של המיקום לכתובת
    reverseGeocode(lat, lng, (address) => {
        if (popupContent) {
            // שמירת המיקום, הכתובת וההערה ב-Local Storage
            saveLocation(lat, lng, address, popupContent);

            // הוספת סימון על המפה
            const marker = L.marker([lat, lng]).addTo(map);
            marker.bindPopup(popupContent).openPopup();

            // עדכון הרשימה עם המיקום החדש
            updateLocationList();
        }
    });
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

                // גיאוקודינג של המיקום כדי לקבל כתובת
                reverseGeocode(lat, lng, (resolvedAddress) => {
                    // שמירת המיקום, הכתובת וההערה ב-Local Storage
                    saveLocation(lat, lng, resolvedAddress, note);

                    // מרכז את המפה לסימון
                    map.setView([lat, lng], 13);

                    // עדכון הרשימה עם המיקום החדש
                    updateLocationList();
                });
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
