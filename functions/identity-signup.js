const fetch = require("node-fetch");

exports.handler = async (event) => {
  const { user } = JSON.parse(event.body);
  console.log("New user signup:")
  console.log(JSON.stringify(user, null, 2));

  const netlifyID = user.id;
  const email = user.email;

  const response = await fetch("https://graphql.us.fauna.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FAUNA_SERVER_KEY}`,
    },
    body: JSON.stringify({
      query: `
        mutation ($netlifyID: ID! $email: String!) {
          createUser(data: {netlifyID: $netlifyID, email: $email}) {
            netlifyID
            email
          }
        }
      `,
      variables: {
        netlifyID,
        email,
      },
    }),
  })
    .then((res) => res.json())
    .catch((err) => console.error(JSON.stringify(err, null, 2)));

  console.log(JSON.stringify(response, null, 2));

  return {
    statusCode: 200,
    // body: JSON.stringify({ app_metadata: { roles: ["user"] } }), // Optional metadata args; see docs
  };
};

