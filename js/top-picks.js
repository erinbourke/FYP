import { db } from "./firebaseConfig.js";
import { ref, child, getDatabase, push, set, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

//const db = getDatabase();
// const groupID = "testGroup2ID"; 
// const cityName = "Vienna";

// const userDataString=localStorage.getItem('userData');
// if(userDataString){
//     const userData = JSON.parse(userDataString);
//     const cityName = userData.cityName;

//     document.getElementById("cityHeading").innerText = cityName;
// }

//https://firebase.google.com/docs/database/web/read-and-write

export async function getTopAccom(){
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
        const userData = JSON.parse(userDataString);
        const cityName = userData.cityName;
        const groupID = userData.groupID;
        //const userID = userData.userID;

        const topAccomVoteCountRef = ref(db, 'voteCount'+'/'+ groupID + '/' + cityName+ '/hostels');
        const hostelsDataRef = ref(db, 'hostels');

        try{
            const snapshot = await get(topAccomVoteCountRef);

            if(snapshot.exists()){
                const numVotes = snapshot.val();
                let maxVotes = 0;
                let topAccom = null;

                for (let xid in numVotes){
                    if(numVotes[xid]> maxVotes){
                            maxVotes = numVotes[xid];
                            topAccom = xid;
                    }
                }

                const hostelsSnapshot = await get(hostelsDataRef);
                let topHostelName = topAccom;

                if (hostelsSnapshot.exists()){
                    const hostels = hostelsSnapshot.val();

                    for(let key in hostels){
                        if(hostels[key].xid === topAccom && hostels[key].cityName === cityName){
                            topHostelName = hostels[key].name;
                            break;
                        }
                    }
                }


                const container = document.getElementById("topAccomContainer");
                if (container) {
                    const section = document.createElement("div");

                    //https://getbootstrap.com/docs/5.3/utilities/spacing/ - for centering each section

                    if(maxVotes < 2){
                        section.className = "card border-success mb-3 mx-auto";
                        section.style.width = "400px";
                        section.innerHTML = `
                            <div class="text-center">
                                <h3>Top Hostel:</h3><p>${topHostelName} with ${maxVotes} vote</p>
                                <hr> 
                            </div>                  
                        `;
                    }
                    else{
                        section.className = "card border-success mb-3 mx-auto";
                        section.style.width = "400px";
                        section.innerHTML = `
                            <div class="text-center">
                                <h3>Top Hostel:</h3><p>${topHostelName} with ${maxVotes} votes</p>
                                <hr>
                            </div>
                        `;
                    }
                    container.appendChild(section);  
                } 
            }
        
        } catch(error){
            console.error("Error getting the top hostel:",error);
        } 
    }
}

export async function getTopPoi(){
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
        const userData = JSON.parse(userDataString);
        const cityName = userData.cityName;
        const groupID = userData.groupID;
        //const userID = userData.userID;

        const topPoiVoteCountRef = ref(db, 'voteCount'+'/'+ groupID + '/' + cityName+ '/points of interest');
        const poiDataRef = ref(db, 'points of interest');

        try{
            const snapshot = await get(topPoiVoteCountRef);

            if(snapshot.exists()){
                const numVotes = snapshot.val();
                let maxVotes = 0;
                let topPoi = null;

                for (let xid in numVotes){
                    if(numVotes[xid]> maxVotes){
                            maxVotes = numVotes[xid];
                            topPoi = xid;
                    }
                }
                const poiSnapshot = await get(poiDataRef);
                let topPoiName = topPoi;

                if (poiSnapshot.exists()){
                    const poi = poiSnapshot.val();

                    for(let key in poi){
                        if(poi[key].xid === topPoi && poi[key].cityName === cityName){
                            topPoiName = poi[key].name;
                            break;
                        }
                    }
                }
                const container = document.getElementById("topAccomContainer");
                if(container){
                    const section = document.createElement("div");

                    if(maxVotes < 2){
                        section.className = "card border-success mb-3 mx-auto";
                        section.style.width = "400px";
                        section.innerHTML = `
                            <div class="text-center">
                                <h3>Top Point of Interest:</h3><p>${topPoiName} with ${maxVotes} vote</p>
                                <hr>
                            </div>                  
                        `;
                    }
                    else{
                        section.className = "card border-success mb-3 mx-auto";
                        section.style.width = "400px";
                        section.innerHTML = `
                            <div class="text-center">
                                <h3>Top Point of Interest:</h3><p>${topPoiName} with ${maxVotes} votes</p>
                                <hr>
                            </div>
                        `;
                    }
                    container.appendChild(section);
                }  
            } 
        
        } catch(error){
            console.error("Error getting the top poi:",error);
        } 
    }
}


//now i can display all my cities that a particular group have voted on
export async function getAllCities() {
    const userDataString = localStorage.getItem('userData');
    if(userDataString) {
        const userData = JSON.parse(userDataString);
        const groupID = userData.groupID;
        
        //get the vote data
        const groupVotesRef = ref(db, 'voteCount/' + groupID);
        
        try {
            const snapshot = await get(groupVotesRef);
            
            if(snapshot.exists()) {
                const groupData = snapshot.val();
                const cities = Object.keys(groupData);
                
                //loop through the cities
                for(const cityName of cities) {
                    //add a heading for each city
                    const container = document.getElementById("topAccomContainer");
                    if(container) {
                        const cityHeader = document.createElement("h2");
                        cityHeader.innerText = cityName;
                        cityHeader.className = "mt-5 mb-3 text-success text-center border-bottom pb-2";
                        container.appendChild(cityHeader);
                        
                        
                        const originalCity = userData.cityName;
                        userData.cityName = cityName;
                        localStorage.setItem('userData', JSON.stringify(userData));
                        
                        //call both functions to diplay the top voted hostel and poi under each city heading
                        await getTopAccom();
                        await getTopPoi();
                        
                    
                        userData.cityName = originalCity;
                        localStorage.setItem('userData', JSON.stringify(userData));
                    }
                }
            } 
            else {
                console.log("No votes found for this group");
            }
        } catch (error) {
            console.error("Error getting all cities:", error);
        }
    }
}
