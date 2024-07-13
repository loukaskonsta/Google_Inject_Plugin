let userProfileInfo = "usernae";

//function to get users' ID
function getUserInfo() {
  chrome.identity.getProfileUserInfo(function(userInfo) {
    console.log(JSON.stringify(userInfo));
    chrome.storage.local.set({ userProfileInfo: userInfo });
  });
}

//when the plugin is installed/updated, make sure to maintain access to users' id
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // Code to run when the extension is first installed
    console.log('Extension installed!');
    getUserInfo();
  } else if (details.reason === 'update') {
    // Code to run when the extension is updated
    console.log('Extension updated!');
    getUserInfo();
  }
});    

//when users are entering the google search page
     chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo && changeInfo.status === 'complete' && tab.url && tab.url.includes('https://www.google.com/search')) {
 
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: () => {
              const searchInput = document.querySelector('input[name="q"]');
              const searchQuery = searchInput.value;
              
              /*Search if there are relevant fact-check articles in google fact check explorer*/
              const query = searchQuery;
              const apiKey = 'AIzaSyBoAVnhdC_8IVjRuYyqTWI4Ix_K8JFZtfg';
              const apiUrl = `https://factchecktools.googleapis.com/v1alpha1/claims:search?key=${apiKey}&query=${query}&languageCode=${'en'}&maxAgeDays=${7}`;

              fetch(apiUrl)
              .then(response => response.json())
              .then(data => {
                /*How many articles are there
                const results = data.claims;
                console.log('Search query:', results);
                */
            
                // Extract fact-checked articles and put them in a list
                const articles = data.claims || [];

                //if articles do exist
                if(articles.length>0){  

                //container where top container and articles container are added
                const masterContainer = document.createElement('div');

                // Create elements for the top row
                const topRow = document.createElement('div');
                topRow.style = `display: flex; align-items: center;`;

                // Create an image element
                const image = document.createElement('img');
                image.src = chrome.runtime.getURL('coinform_logo.png');
                image.alt = 'Co-Inform Logo';
                image.style.width = '15%';
                topRow.appendChild(image);

                // Create a div for the text on the right
                const textContainer = document.createElement('div');
                textContainer.textContent = 'Explore verified articles by trusted fact-checkers, related to your search!';
                textContainer.style = `flex: 1; color: #735972; background-color: #D9EAE7; padding: 3% 1%;`;
                topRow.appendChild(textContainer);

                // Append the top row to the master container
                masterContainer.appendChild(topRow);

                // Create a box to display the fact-checked articles
                const resultsContainer = document.createElement('div');
                resultsContainer.style.cssText = 'margin-left: calc(90px + 1%); border: 1px solid #D9EAE7; border-bottom: none;';
                //document.body.appendChild(resultsContainer);

                let count = 0;

                let finalUserName = "";
                chrome.storage.local.get(['userProfileInfo'], function(result) {
                  const userProfileInfo = result.userProfileInfo;
                  console.log(userProfileInfo);
                  finalUserName = userProfileInfo;
                });


                  articles.forEach((article, index) => {

                    if(count<3){
                      const articleBox = document.createElement('div');
                      articleBox.style = 'background-color: white; padding: 0% 1%;';


                      if(index !== articles.length - 1){
                        articleBox.style.borderBottom = '1px solid #CEE4E0';
                      }

                      /*console.log(article.claimReview[0]);//explore vars
                      console.log(article.claimReview[0].languageCode);
                      console.log(article.claimReview[0].publisher.name);
                      console.log(article.claimReview[0].publisher.site);
                      console.log(article.claimReview[0].textualRating);
                      console.log(article.text);
                      console.log(article.claimant);
                      console.log(article.claimDate);*/
        
                      const articleTitle = document.createElement('p');
                      articleTitle.textContent = article.claimReview[0]['title'];
                      articleTitle.style.color = '#573052';
                      articleTitle.style.fontWeight = 'bold';
                      articleTitle.style.cursor = 'pointer';

                      articleBox.appendChild(articleTitle);
                      articleTitle.onclick = function() {
                        window.location.href = article.claimReview[0]['url'];
                        console.log(`Clicked on fact-checked article: ${article.claimReview[0].title}`);
                        const url = "https://script.google.com/macros/s/AKfycbwQFjX4eJrYZe7DgLzhx1RM0yJBvhcvFqBlcnAcgArhOUT562cb7xNoNXw5x75ZIf-s/exec"; // Replace with the URL of your deployed web app
                          
                        const name = finalUserName;
                        const articleName = article.claimReview[0].title;

                        const currentTime = new Date().toLocaleTimeString();
                        
                        var nowDate = new Date(); 
                        const currentDate = nowDate.getDate()+'/'+(nowDate.getMonth()+1)+'/'+ nowDate.getFullYear(); 

                        var myArray = [name, currentTime, currentDate, query, articleName];

                        //Btw, this: myArray: JSON.stringify(myArray), could simply be a variable which can be accessed by: e.parameter.varname

                        fetch(url, {
                          method: "POST",
                          mode: "cors",
                          body: new URLSearchParams({  myArray: JSON.stringify(myArray)  })
                        })
                          .then(response => response.text())
                          .then(data => console.log(data))
                          .catch(error => console.error(error));     
                    };


                    // Create elements for article details
                    const articleDetailsBox = document.createElement('div');
                    articleDetailsBox.style = `display: flex; align-items: center;`;

                    // Create an article image element
                    const imageArticle = document.createElement('img');
                    imageArticle.src = chrome.runtime.getURL('coinform_logo.png');
                    imageArticle.alt = 'Co-Inform Logo';
                    imageArticle.style.width = '13%';
                    articleDetailsBox.appendChild(imageArticle);


                    // Create a div for the two article text on the right
                    const articleDetails = document.createElement('div');
                    articleDetails.style.cssText = 'display: flex; flex-direction: column; flex: 1; justify-content: space-between;';

                    // Top line of text
                    const textLine1 = document.createElement('div');
                    textLine1.textContent = article.claimReview[0].publisher.name;
                    textLine1.style.cssText = 'color: #573052; font-weight: bold;font-size: smaller;';
                    articleDetails.appendChild(textLine1);

                    // Bottom line of text
                    const textLine2 = document.createElement('div');
                    textLine2.textContent = new URL(article.claimReview[0].url).hostname;
                    textLine2.style.cssText = 'color: #9BC6C0; font-weight: bold;font-size: smaller;';
                    articleDetails.appendChild(textLine2);

                    // Append the text container to the top row
                    articleDetailsBox.appendChild(articleDetails);
                    // Append the article row to the master container
                    articleBox.appendChild(articleDetailsBox);

                    resultsContainer.appendChild(articleBox);

                    count++;/*add only the first 3 links*/
                  }

              
                  });/* end of loop for adding each article*/

                  masterContainer.appendChild(resultsContainer);
                  masterContainer.id = 'masterContainer';

                  const GoogleResults = document.getElementById('search');/*div id="search" of the google results page*/

                  // Check if GoogleResults contains an element with id 'masterContainer'
                  const masterContainerExists = GoogleResults.querySelector('#masterContainer');
                  if (masterContainerExists) {
                    console.log('GoogleResults contains masterContainer.');
                    //masterContainer.remove();
                  } else {
                    console.log('GoogleResults does not contain masterContainer.');
                    GoogleResults.insertBefore(masterContainer, GoogleResults.firstChild);
                  }

                  
                  //const searchResultsContainer1 = document.getElementById('search');/*div id="search" of the google results page*/
                  //searchResultsContainer1.insertBefore(masterContainer, searchResultsContainer1.firstChild);



                }/* if articles are more than 0 */

              })/*end of fething the articles*/
            .catch(error => console.error(error));
            }
          }) /*finish executing script*/

          
        }
      });