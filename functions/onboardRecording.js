// validate call comes from transloadit

// FUTURE: somehow validate that the payload originated from the same user as the user value in the payload. Like, in theory a user could log in with one account, submit their transloadit payload with the userID of another account, and their recording would go in there instead. Right?

exports.handler = async (event, context) => {

  console.log(JSON.stringify(event, null, 2));
  console.log(JSON.stringify(context, null, 2));
    return {
      statusCode: 200,
    }

  // if (context?.clientContext?.user) { // Verifies logged-in user
  //   // process the function
  //   const { identity, user } = context.clientContext;
  //   console.log("Upload Key request from user:");
  //   console.log(JSON.stringify(user, null, 2));
  //   console.log(JSON.stringify(identity, null, 2));
  //   console.log("Upload Key Request granted.");
  //   return {
  //     statusCode: 200,
  //     body: JSON.stringify({'TRANSLOADIT_KEY' : `${process.env.TRANSLOADIT_KEY}`, 'TRANSLOADIT_TEMPLATE_ID' : `${process.env.TRANSLOADIT_TEMPLATE_ID}`})
  //   }
  // } else {
  //   console.log("Upload Key Request denied.");
  //   console.log(JSON.stringify(event, null, 2));
  //   return {
  //     statusCode: 401,
  //     body: JSON.stringify('Unauthorized')
  //   }
  // }
}

// Create Fauna entry containing:
//  - userID
//  - aws recording url of original file and transcoded file(s) (may want make a low-fi mp3 version for preview streaming in the FE UI)
//  - timestamp
//  - other relevant metadata (perhaps a cache of the full JSON objects from the original call TO transloadit and this call FROM transloadit)

// Kick off transcription w/ transcription microservice. Use a Netlify background function. See https://docs.netlify.com/functions/build-with-javascript/

// Questions:
//  - What's the best way to alert the FE UI about the progress of these events?
//  - What's the best way to fire off the transcription request to my transcription microservice?
//  - Should transcription be automatic or a user-initiated event separate from file upload? (or maybe a form checkbox at upload time? transcribe immediately vs upload only? MVP I think is transcribe immediately...)

// IDEA: each user has a database "in-progress queue" object that's always empty unless there's a file actively in this pipeline. So the front-end can intermittently poll that object after the user initiates an upload, and at the completion of each step in the process, that object can be updated with the progress. e.g. transcoding finished, transcription in progress, transcription finished. The only question would be whether that queue object is simply emptied when everything is done, or whether a "completed" entry sticks around for a bit with metadata for the UI? But then how long does it stick around? And if it's never deleted then it defeats the purpose of a quick and easy object to poll. So maybe the queue only empties on success. So if the FE sees an empty queue object it knows the process was successful and can refresh the UI. And you can always have a manual "refresh" button for the user just in case the recording doesn't show up!