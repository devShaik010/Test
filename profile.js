
let user;
console.log(user);


function adduserTitle(user){
    const userTitle = document.getElementById('userTitle')
    userTitle.innerText = `Hi ${user}`;
}

function saveprofile() {
    const diseases = document.getElementById('diseases');
    const allergies = document.getElementById('allergies');
    const weight = document.getElementById('weight');
    
    const profile = {
        "diseases": diseases.value,
        "allergies": allergies.value,
        "weight": weight.value
    };
    console.log(profile);
    localStorage.setItem('profile', JSON.stringify(profile));
    window.location.href='index.html';
}
function saveuser() {
    const username = document.getElementById('username').value;
    user = username;
    localStorage.setItem('user', JSON.stringify(user));
    console.log(user);
    
}

