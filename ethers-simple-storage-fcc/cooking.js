// for learning asynchronous functions

// cook popcorn
// pour drinks
// start movie

// in solidity this is important because
    // deploy a contract? wait for it to be deployed

async function setupMovieNight() {
    await cookPopcorn();
    await pourDrinks();
    startMovie();
}

function cookPopcorn() {
    // some code here
    return Promise(/* Some Code Here*/)
}