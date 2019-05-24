window.addEventListener('load', function() {

  var accessToken;
  var expiresAt;
  var userProfile;

  var content = document.querySelector('.content');
  var loadingSpinner = document.getElementById('loading');
  content.style.display = 'block';
  loadingSpinner.style.display = 'none';

  var webAuth = new auth0.WebAuth({
    domain: AUTH0_DOMAIN,
    clientID: AUTH0_CLIENT_ID,
    redirectUri: AUTH0_CALLBACK_URL,
    responseType: 'token id_token',
    scope: 'openid profile',
    leeway: 60
  });

  var loginStatus = document.querySelector('.container h4');
  var loginView = document.getElementById('login-view');
  var homeView = document.getElementById('home-view');

  // buttons and event listeners
  var homeViewBtn = document.getElementById('btn-home-view');
  var loginBtn = document.getElementById('qsLoginBtn');
  var logoutBtn = document.getElementById('qsLogoutBtn');
//Get divs for employee and manager and no role 
  var divManager = document.getElementById('divManager');
  var divEmployee = document.getElementById('divEmployee');
  var divNoRole = document.getElementById('divNoRole');
  
  homeViewBtn.addEventListener('click', function() {
    homeView.style.display = 'inline-block';
    loginView.style.display = 'none';
  });

  loginBtn.addEventListener('click', function(e) {
    e.preventDefault();
    webAuth.authorize();
  });

  logoutBtn.addEventListener('click', logout);

  function localLogin(authResult) {
    // Set isLoggedIn flag in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    // Set the time that the access token will expire at
    expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    );
    accessToken = authResult.accessToken;
    idToken = authResult.idToken;
  }

  function renewTokens() {
    webAuth.checkSession({}, (err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        localLogin(authResult);
      } else if (err) {
        alert(
            'Could not get a new token '  + err.error + ':' + err.error_description + '.'
        );
        logout();
      }
      displayButtons();
    });
  }


  function logout() {
    // Remove isLoggedIn flag from localStorage
    localStorage.removeItem('isLoggedIn');
    // Remove tokens and expiry time
    accessToken = '';
    idToken = '';
    expiresAt = 0;

    webAuth.logout({
      return_to: window.location.origin
    });

    displayButtons();
  }

  function isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    var expiration = parseInt(expiresAt) || 0;
    return localStorage.getItem('isLoggedIn') === 'true' && new Date().getTime() < expiration;
  }
   //function for getting role of a user and showing appprpriate divs
  function getUserRole(){
    var promise1 = new Promise(function(resolve, reject) {
      if (!userProfile) {
        if (!accessToken) {
          console.log('Access token must exist to fetch profile');
        }
  
        webAuth.client.userInfo(accessToken, function(err, profile) {
          if (profile) {
            userProfile = profile;
            var role = "";
            if(userProfile["https://bank0.com/app_metadata"] == null){
              role = "No Role";
            }
            else{
              var isManager = userProfile["https://bank0.com/app_metadata"].authorization.roles.includes("Manager");
              if(isManager){
                role = "Manager";
              }
              else{
                role = "Employee";
              }
            }
            
            resolve(role);
          }
        });
      } 
    });
    
    promise1.then(function(value) {
      if(value == "Manager"){
        console.log("Manager");
        divManager.hidden = false;
        divEmployee.hidden = true;
        divNoRole.hidden = true;
      }else if(value == "Employee"){
        divManager.hidden = true;
        divEmployee.hidden = false;
        divNoRole.hidden = true;
        console.log("Employee");
      }
      else{
        divManager.hidden = true;
        divEmployee.hidden = true;
        divNoRole.hidden = false;
      }
    });

  }

  function handleAuthentication() {
    webAuth.parseHash(function(err, authResult) {
      console.log("I am here 1");
      if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';
        localLogin(authResult);
        loginBtn.style.display = 'none';
        homeView.style.display = 'inline-block';
        
       getUserRole();


      } else if (err) {
        homeView.style.display = 'inline-block';
        console.log(err);
        alert(
          'Error: ' + err.error + '. Check the console for further details.'
        );
      }
      displayButtons();

    });
  }

  function displayButtons() {
    if (isAuthenticated()) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      loginStatus.innerHTML = 'You are logged in!';
             
    } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      loginStatus.innerHTML =
        'You are not logged in! Please log in to continue.';
        divManager.hidden = true;
        divEmployee.hidden = true;
    }
  }

  if (localStorage.getItem('isLoggedIn') === 'true') {
    renewTokens();
  } else {
    handleAuthentication();
  }
});
