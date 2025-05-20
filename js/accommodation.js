
//import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebaseConfig.js";
//import { collection, addDoc } from "firebase/firestore";
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { ref, getDatabase, push, set, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';


//OpenTripMap Documentation: https://dev.opentripmap.org/docs#/Objects%20list/getListOfPlacesByLocation
//List of categories: https://dev.opentripmap.org/en/catalog.tree.json

var apiKey = "5ae2e3f221c38a28845f05b605afb3f20919fd21f3db1dd73cc71282";

export function fetchCityCoords(cityName){
    var url = `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(cityName)}&apikey=${apiKey}`;

    
    fetch(url)
        .then((Response)=> Response.json())
        .then((data) => {
            console.log(data);
            console.log(data); 
            if (data.lon && data.lat) {
                console.log(`Latitude: ${data.lat},Longitude: ${data.lon}` );
                fetchHostels(data.lon, data.lat,cityName); 
            } else {
                console.error('Invalid or missing coordinates from city data');
                document.querySelector("#results").textContent = "Invalid city name. Try again.";
            }
        })
        .catch((error) => console.error('Error fetching city coordinates:', error));
    
}

function renderAccom(features){
    console.log(features);
   
    var results = document.querySelector("#results");
    // results.innerHTML = "<h2 class='text-center mb-4 card-header'>Your Accommodation Options:<h2>";
    //create h2 for hostels 1,2,3
    
    var form = document.createElement("form");
    form.id="voteForm"
    
    features.forEach((hostel, index)=>{
        //const xid = hostel.properties.xid;
        const lat = hostel.geometry.coordinates[1];  
        const lon = hostel.geometry.coordinates[0];
        const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lat=${lat}&lon=${lon}&kinds=railway_stations&apikey=${apiKey}`;
    
    
        var label = document.createElement("label");

        var radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "hostelVote";
        radio.value = hostel.properties.xid;

        label.appendChild(radio);
        label.innerHTML +=`<h3>${hostel.properties.name} (Rating: ${hostel.properties.rate || 'N/a '})</h3>`;
        
            
        fetch(url)
            .then(res => res.json())
            .then(data => {
            
            if (data.features && data.features.length > 0) {
                const nearestStation = data.features[0]; 
                const distance = nearestStation.dist;  
                const stationName = nearestStation.properties.name;  

                
                label.innerHTML += `<p>Nearest train station: ${stationName} `;
                } 
                else {
                    label.innerHTML += `<p>No nearby train stations found.</p>`;
                }
            })
            .catch(err => {
            console.error("Error fetching train station data:", err);
            label.innerHTML += `<p>Error fetching train station data.</p>`;
            });

        form.appendChild(label);
        form.appendChild(document.createElement("br"));

    });
    var voteButton = document.createElement("button");
    voteButton.textContent = "Vote";
    voteButton.type = "button";
    voteButton.className = "btn btn-success mt-3";
    voteButton.addEventListener("click",submitVote);

    form.append(voteButton);
    results.appendChild(form);
    
} 

async function submitVote(){
    const form = document.querySelector("#voteForm");
    const selectedRadio = form.querySelector('input[name="hostelVote"]:checked');

    if(selectedRadio){
        
        const favHostelID = selectedRadio.value;
        //hardcoded in these vals at first
        //const groupID = "testGroup4ID";
        //const userID = "user1";

        //get these from local storage now
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            const cityName = userData.cityName;
            const groupID = userData.groupID;
            const userID = userData.userID;

            const voteData = {
                favHostelID: favHostelID
            };

            //store the votes in tree form unser the group id and then the location id as a group will be voting on a number of locations
            const voteRef = ref(db, 'votes/'  + groupID + '/' + userID  +'/'+ cityName+ '/hostels' ); // Store votes under the group ID
            await set(voteRef, voteData);
            console.log('Vote stored:', voteData);

            //Referencing Firebase Doumentation for this part - DataSnapshot
            //https://firebase.google.com/docs/reference/node/firebase.database.DataSnapshot

            //make my tree for how it will look in firebase 
            const voteCountRef = ref(db, 'voteCount'+'/'+ groupID + '/' + cityName + '/hostels/' + favHostelID);
        
            try{
                //just for this line got from Firebase Documentation - hadto change slightly to work for Realtime Database
                //https://firebase.google.com/docs/firestore/query-data/aggregation-queries
                //https://stackoverflow.com/questions/66943697/firebase-real-time-db-retrieving-of-specific-data-from-multiple-users-in-swift
                //get the current value of the vote in db
                const snapshot = await get(voteCountRef);
                let counter;

                //now if there is a value there let the counter equal that else let it equal 0 
                if(snapshot.exists()){
                    counter = snapshot.val();
                }
                else{
                    counter = 0;
                }
                //now add 1 to account foe vote that was just submitted
                counter++;
                //set the new current value of the counter
                await set(voteCountRef, counter);

                console.log('Count for '+cityName+':'+counter)

                document.getElementById("nextButton").disabled = false;
                //alert user that their vote has been made and to move onto the next page
                alert("Your vote has been cast! Please press 'Next' to move onto the next page.");
            } catch (error){
                console.log("Error updating vote counter", error);
            }
        }
    }
    else{
        //tell user to pick a hostel to vote on
        alert('Please select a hostel before submitting your vote.');
    }
}

async function saveHostelToDB(cityName,xid,name,rating) {
    try {
        console.log(db);
        const hostelIdRef = ref(db, "hostels");
        //await hostelIdRef, { xid };
        const newHostelRef = push(hostelIdRef);
        await set(newHostelRef, { cityName,xid,name,rating });
        console.log("Hostel Data saved:", cityName,xid,name,rating);
    } catch (error) {
        console.error("Error saving hostel:", error);
    }
}

function fetchHostels(lon,lat,cityName){
    // Radius in meters
    const radius = 8000; 

    // Convert the radius to approximate latitude/longitude degrees
    const degreesLat = radius / 111320;
    const degreesLon = radius / (111320 * Math.cos(lat * Math.PI / 180));

    // Define bounding box
    const lonMin = lon - degreesLon;
    const lonMax = lon + degreesLon;
    const latMin = lat - degreesLat;
    const latMax = lat + degreesLat;

    console.log(`Fetching hostels for lat: ${lat}, lon: ${lon} with bounding box:`);
    console.log(`latMin: ${latMin}, latMax: ${latMax}, lonMin: ${lonMin}, lonMax: ${lonMax}`);

    var url = `https://api.opentripmap.com/0.1/en/places/bbox?lon_min=${lonMin}&lat_min=${latMin}&lon_max=${lonMax}&lat_max=${latMax}&kinds=hostels&format=geojson&apikey=${apiKey}`;

    fetch(url)
        .then((Response)=> Response.json())
        .then((data) => {
            if (data.features && Array.isArray(data.features)) {
                renderAccom(data.features.slice(0,3));

                    data.features.slice(0,3).forEach(hostel => {
                        const hostelData ={
                            city: cityName,
                            id: hostel.properties.xid,
                            name: hostel.properties.name,
                            rating: hostel.properties.rate
                        }
                         saveHostelToDB(hostelData.city,hostelData.id, hostelData.name,hostelData.rating);//cityName,hostelData.id, hostelData.name,hostelData.rating
                    });
                    
                

            } else {
                console.error('No hostels found or invalid response format');
            }
        })
        .catch((error) => console.error('Error fetching hostels:', error));
}

// document.querySelector("#searchButton").addEventListener("click", (event) => {
//     //prevent form submission
//     event.preventDefault();
//     var cityName = document.querySelector("#cityName").value;
//     if (cityName) {
//         fetchCityCoords(cityName);
//         //fetchHostels(lon,lat);
//     } else {
//         alert("Please enter a city name.");
//     }
// });



