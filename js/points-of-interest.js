import { db } from "./firebaseConfig.js";
import { ref, getDatabase, push, set, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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
                fetchPoi(data.lon, data.lat, cityName); 
            } else {
                console.error('Invalid or missing coordinates from city data');
                document.querySelector("#results").textContent = "Invalid city name. Try again.";
            }
        })
        .catch((error) => console.error('Error fetching city coordinates:', error));
    
}

function renderPoi(features){    
    console.log(features);

    var results = document.querySelector("#results");
    //results.innerHTML = "Points of Interest:";

    var form = document.createElement("form");
    form.id="voteForm"
    //create h2 for hostels 1,2,3
    features.forEach((amusements, index)=>{
        console.log(features);
        const xid = amusements.properties.xid;
        const url = `https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${apiKey}`;

        //commented out this code so i can add radio buttons for voting
        // var poi = document.createElement("p");
        // poi.textContent = `${index + 1}. ${amusements.properties.name}`;
        // results.appendChild(poi);

        var label = document.createElement("label");
        var radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "poiVote";
        radio.value = amusements.properties.xid;

        label.appendChild(radio);
        label.innerHTML += `<h3>${amusements.properties.name} (Rating: ${amusements.properties.rate || 'N/a'})</h3>`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const extraInfo = document.createElement("div");
                const imageUrl = data.preview?.source;
                const description = data.wikipedia_extracts?.text;
                const wikiLink = data.wikipedia;

                console.log(imageUrl, description, wikiLink);

                if (description) {
                    extraInfo.innerHTML += `<p>${description}</p>`;
                }
                if (imageUrl) {
                    extraInfo.innerHTML += `<img src="${imageUrl}" width="250" alt="POI Image"/><br>`;
                }
                if (wikiLink) {
                    extraInfo.innerHTML += `<a href="${wikiLink}" target="_blank">Read more on Wikipedia</a>`;
                }
                label.appendChild(extraInfo);

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
    const selectedRadio = form.querySelector('input[name="poiVote"]:checked');

    if(selectedRadio){
        const favPoiID = selectedRadio.value;
        //hardcoded in these vals at first
        //const groupID = "testGroup4ID";
        //const userID = "user1";
        
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            const cityName = userData.cityName;
            const groupID = userData.groupID;
            const userID = userData.userID;

            const voteData = {
                favPoiID: favPoiID
            };

            //store the votes in tree form under the group id and then the location id as a group will be voting on a number of locations
            const voteRef = ref(db, 'votes/'  + groupID + '/' + userID + '/' + cityName+'/points of interest'); // Store votes under the group ID
            await set(voteRef, voteData);
            console.log('Vote stored:', voteData);

            //Referencing Firebase Doumentation for this part - DataSnapshot
            //https://firebase.google.com/docs/reference/node/firebase.database.DataSnapshot

            //make my tree for how it will look in firebase 
            const voteCountRef = ref(db, 'voteCount'+'/'+ groupID + '/' + cityName + '/points of interest/' + favPoiID);
        
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

                alert("Your vote has been cast! Please press 'Next' to see your results.")
            } catch (error){
            console.log("Error updating vote counter", error);
            }
        }
    }
    else{
        alert('Please select a point of interest before submitting your vote.');
    }
}


async function savePoiToDB(cityName, xid,name,rating) {
    try {
        console.log(db);
        const poiIdRef = ref(db, "points of interest");
        //await hostelIdRef, { xid };
        const newPoiIDRef = push(poiIdRef);
        await set(newPoiIDRef, { cityName,xid,name,rating });
        console.log("POI Data saved:", cityName,xid,name,rating);
    } catch (error) {
        console.error("Error saving POI:", error);
    }
}

function fetchPoi(lon,lat, cityName){
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

    console.log(`Fetching Points of interest for lat: ${lat}, lon: ${lon} with bounding box:`);
    console.log(`latMin: ${latMin}, latMax: ${latMax}, lonMin: ${lonMin}, lonMax: ${lonMax}`);

    var url = `https://api.opentripmap.com/0.1/en/places/bbox?lon_min=${lonMin}&lat_min=${latMin}&lon_max=${lonMax}&lat_max=${latMax}&kinds=amusements&format=geojson&apikey=${apiKey}`;


    fetch(url)
        .then((Response)=> Response.json())
        .then((data) => {
            if (data.features && Array.isArray(data.features)) {
                renderPoi(data.features.slice(0,3));
                
                    data.features.slice(0,3).forEach(amusements => {
                        const poiData ={
                            city: cityName,
                            id: amusements.properties.xid,
                            name: amusements.properties.name,
                            rating: amusements.properties.rate
                        }
                        savePoiToDB(poiData.city, poiData.id, poiData.name, poiData.rating);
                    });


            } else {
                console.error('No poi found or invalid response format');
            }
        })
        .catch((error) => console.error('Error fetching poi:', error));
}
// document.querySelector("#searchButton").addEventListener("click", (event) => {
//     //prevent form submission
//     event.preventDefault();
//     var cityName = document.querySelector("#cityName").value;
//     if (cityName) {
//         fetchCityCoords(cityName);
        
//     } else {
//         alert("Please enter a city name.");
//     }
// });


