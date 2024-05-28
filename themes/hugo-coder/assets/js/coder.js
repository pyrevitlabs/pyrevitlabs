const body = document.body;
const darkModeToggle = document.getElementById('dark-mode-toggle');
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Check if user preference is set, if not check value of body class for light or dark else it means that colorscheme = auto
if (localStorage.getItem("colorscheme")) {
    setTheme(localStorage.getItem("colorscheme"));
} else if (body.classList.contains('colorscheme-light') || body.classList.contains('colorscheme-dark')) {
    setTheme(body.classList.contains("colorscheme-dark") ? "dark" : "light");
} else {
    setTheme(darkModeMediaQuery.matches ? "dark" : "light");
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        let theme = body.classList.contains("colorscheme-dark") ? "light" : "dark";
        setTheme(theme);
        rememberTheme(theme);
    });
}

darkModeMediaQuery.addListener((event) => {
    setTheme(event.matches ? "dark" : "light");
});

document.addEventListener("DOMContentLoaded", function () {
    let node = document.querySelector('.preload-transitions');
    node.classList.remove('preload-transitions');
});

function setTheme(theme) {
    body.classList.remove('colorscheme-auto');
    let inverse = theme === 'dark' ? 'light' : 'dark';
    body.classList.remove('colorscheme-' + inverse);
    body.classList.add('colorscheme-' + theme);
    document.documentElement.style['color-scheme'] = theme;

    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
    
            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    if (theme === 'dark') {
        const message = {
            type: 'set-theme',
            theme: 'github-dark'
        };
        waitForElm('.utterances-frame').then((iframe) => {
            iframe.contentWindow.postMessage(message, 'https://utteranc.es');
        })
        
    }
    else {
        const message = {
            type: 'set-theme',
            theme: 'github-light'
        };
        waitForElm('.utterances-frame').then((iframe) => {
            iframe.contentWindow.postMessage(message, 'https://utteranc.es');
        })
        
    }

    function sendMessage(message) {
        const iframe = document.querySelector('iframe.giscus-frame');
        if (!iframe) return;
        iframe.contentWindow.postMessage({ giscus: message }, 'https://giscus.app');
      }
      sendMessage({
        setConfig: {
          theme: theme,
        },
      });
    
    // Create and send event
    const event = new Event('themeChanged');
    document.dispatchEvent(event);
}

function rememberTheme(theme) {
    localStorage.setItem('colorscheme', theme);
}

// Fetch the latest artifact from the GitHub Actions API fro WIP installer on the develop-4 branch

async function fetchLatestArtifact() {
    const url = `https://api.github.com/repos/pyrevitlabs/pyRevit/actions/artifacts`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            // check the latest artifacts that are from the develop-4 head_branch
            const latestArtifact = data.artifacts.find(artifact => artifact.workflow_run.head_branch === 'develop-4');
            return {
                url: latestArtifact.url.split('{')[0].split('/actions/artifacts/')[1],
                run_id: latestArtifact.workflow_run.id,
                head_branch: latestArtifact.workflow_run.head_branch,
            };
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error fetching artifacts:', error);
        return null;
    }
}

fetchLatestArtifact()
    .then(artifact => {
        if (artifact) {
            // console.log('Latest artifact URL:', artifact.url);
            // console.log('Latest run number:', artifact.run_id);
            // console.log('Workflow details:', artifact.head_branch);
            // reconstruct the download url from https://github.com/pyrevitlabs/pyRevit/actions/runs/9252590255/artifacts/1540428578
            const downloadUrl = `https://github.com/pyrevitlabs/pyRevit/actions/runs/${artifact.run_id}/artifacts/${artifact.url}`;
            console.log('Download URL:', downloadUrl);
            // replace the download link in the page from downloadUrl to the const
            const downloadLink = document.querySelector('.downloadUrl');
            downloadLink.href = downloadUrl;


        }
    })
    .catch(error => {
        console.error('Error:', error);
    });