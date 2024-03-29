// paginated fetch for lots of recordings
// way to check just for changes to a single recording (i.e. waiting for transcription to be completed and updated)

const querystring = require('querystring');
// const fetch = require("node-fetch");
var faunadb = require('faunadb')
var q = faunadb.query

var client = new faunadb.Client({
  secret: process.env.FAUNA_SERVER_KEY,
  domain: 'db.us.fauna.com',
  queryTimeout: 30000,
})

// TODO FUTURE: somehow validate that the payload originated from the same user as the user value in the payload. Like, in theory a user could log in with one account, submit their transloadit payload with the userID of another account, and their recording would go in there instead. Right?

exports.handler = async (event, context) => {

  if (!context?.clientContext?.user) { // Verifies logged-in user
    console.log("User Recordings Request denied.");
    console.log(JSON.stringify(event, null, 2));
    return {
      statusCode: 401,
      body: JSON.stringify('Unauthorized')
    }
  }

  const { identity, user } = context.clientContext;

  console.log('FETCH USER RECORDINGS');
  console.log(context);
  console.log(event);
  // console.log(process.env);
  const body = JSON.parse(event.body);

  console.log(body)
  console.log(`user.id: ${user.sub}`)
  const netlifyID = user.sub;

  // var after = faunadb.parseJSON(Buffer.from("WyJUZXN0QXVkaW8ubTRhIix7IkB0cyI6IjIwMjItMDItMjRUMDY6MTI6MzcuMDY5MDM2WiJ9LG51bGwseyJAcmVmIjp7ImlkIjoiMzI0NDU0OTAyMjkwOTcyNzQ1IiwiY29sbGVjdGlvbiI6eyJAcmVmIjp7ImlkIjoiUmVjb3JkaW5nIiwiY29sbGVjdGlvbiI6eyJAcmVmIjp7ImlkIjoiY29sbGVjdGlvbnMifX19fX19XQ==", "base64").toString("utf8"));
  var after = null;
  if(body.hasOwnProperty('after') && body.after && (body.after.length > 0)) {
    console.log('after : ', body.after)
    after = faunadb.parseJSON(Buffer.from(body.after, "base64").toString("utf8"));
  }
  var before = null;
  if(body.hasOwnProperty('before') && body.before && (body.before.length > 0)) {
    console.log('before : ', body.before)
    before = faunadb.parseJSON(Buffer.from(body.before, "base64").toString("utf8"));
  }

  const PAGINATION_SIZE = 10;

  var results = {}      

    // const netlifyID = "cb27daef-4bfc-4f69-9d44-113e4605bad2";
    // var after = [];
    // var results = {};

  try {
    /*
    attempt to hit fauna
    */
  //  after = [];
  // TODO: add "before" into netlifyID function
    // const result = await client.query(
    //   q.Call(q.Function("fetch_recordings_by_netlifyID"), [netlifyID, after])
    // )
    const result = await client.query(
      q.Call(q.Function("paginated_rec_fields_by_user_sort_by_date_desc"), [netlifyID, PAGINATION_SIZE, before, after])
    )
    .then(function (res) {
      // console.log('Result:', res);
      // console.log(res.after)

      // console.log(typeof(res.after[0]))
      // console.log(typeof(res.data[0][0]))
      // console.log(res.data[0][0].toString())
      // console.log(q.ToString(res.data[0][0]))
      // console.log(typeof(q.ToString(res.data[0][0])))
      // console.log(Buffer.from(JSON.stringify(res.after)).toString("base64"))
      // console.log(faunadb.parseJSON(Buffer.from(Buffer.from(JSON.stringify(res.after)).toString("base64"), "base64").toString("utf8")))
      var cursors = []
      if (res.hasOwnProperty('before') && res.before.length > 0) {
        cursors.push( Buffer.from(JSON.stringify(res.before)).toString("base64"))
      }
      res.data.forEach((item) => {
        cursors.push( Buffer.from(JSON.stringify(item.slice(0,2))).toString("base64"))
      })
      if (res.hasOwnProperty('after') && res.after.length > 0) {
        cursors.push(Buffer.from(JSON.stringify(res.after)).toString("base64"))
      }
      // console.log('cursors : ', cursors)
      results = {
        before : ((res.hasOwnProperty('before') && res.before.length > 0) ? Buffer.from(JSON.stringify(res.before)).toString("base64") : ''),
        after : ((res.hasOwnProperty('after') && res.after.length > 0) ? Buffer.from(JSON.stringify(res.after)).toString("base64") : ''),
        data : res.data,
        cursors : cursors
      }
    })
    .catch(function (err) { 
      console.log('Fauna Fetch Error:', err);
      // return {
      //   statusCode : 200,
      // }
    })
    // console.log("final result: ", result)
    /*
    end hit attempt
    */
  }
  catch (err) {
    console.log("error caught");
    console.log(err);
    return {
      statusCode : 200,
    }
  }

  // console.log("results: ", results)
  return {
    statusCode: 200,
    body: JSON.stringify(results)
  }

}