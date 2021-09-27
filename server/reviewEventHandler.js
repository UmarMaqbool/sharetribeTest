require('dotenv').config();
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
const fs = require('fs');

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});
// Start polloing from current time on, when there's no stored state
const startTime = new Date();

// Polling interval (in ms) when all events have been fetched.
const pollIdleWait = 10000; // 5 minutes
// Polling interval (in ms) when a full page of events is received and there may be more
const pollWait = 1000; // 1s

// File to keep state across restarts. Stores the last seen event sequence ID,
// which allows continuing polling from the correct place
const stateFile = './last-sequence-id.state';

const queryEvents = args => {
  var filter = { eventTypes: 'review/created,review/updated' };
  return integrationSdk.events.query({ ...args, ...filter });
};

const saveLastEventSequenceId = sequenceId => {
  // Save state to local file
  try {
    fs.writeFileSync(stateFile, parseInt(sequenceId, 10).toString());
  } catch (err) {
    throw err;
  }
};

const loadLastEventSequenceId = () => {
  // Load state from local file, if any
  try {
    const data = fs.readFileSync(stateFile);
    let id = parseInt(data, 10);
    console.log(id);
    return id;
  } catch (err) {
    return null;
  }
};

const handleEvent = event => {
  // detect change and handle event
  // ...

  console.log(JSON.stringify(event));
  // let rating = event.attributes.rating;
  // let listingId = event.attributes.resource?.relationships?.listing?.data.id.uuid
  // let count, avg, calculatedAvg;
  // let newRatting = Math.floor(Math.random() * 5) + 1;
  // integrationSdk.listings
  //   .open(
  //     {
  //       id: '614efaee-30e1-4a7c-96c0-23299940af97',
  //     },
  //     {
  //       expand: true,
  //     }
  //   )
  //   .then(res => {
  //     let metaData = res.data.data.attributes.metadata;
  //     if (metaData) {
  //       count = metaData.reviewCount ? metaData.reviewCount : 1;
  //       avg = metaData.reviewAvg ? metaData.reviewAvg : 0;
  //       let sum = newRatting + avg * count;
  //       count = count + 1;
  //       calculatedAvg = Math.round(sum / count);
  //       integrationSdk.listings
  //         .update(
  //           {
  //             id: '614efaee-30e1-4a7c-96c0-23299940af97',
  //             metadata: { reviewCount: count, reviewAvg: calculatedAvg },
  //           },
  //           {
  //             expand: true,
  //           }
  //         )
  //         .then(res => {
  //           console.log('Res:', res);
  //         })
  //         .catch(err => {
  //           console.log('err: ', err);
  //         });
  //     }
  //   });
  // Then store the event's sequence ID
  saveLastEventSequenceId(event.attributes.sequenceId);
};
var count = 0;
const pollLoop = sequenceId => {
  var params = sequenceId ? { startAfterSequenceId: sequenceId } : { createdAtStart: startTime };
  queryEvents(params).then(res => {
    const events = res.data.data;
    console.log('hello');
    const fullPage = events.length === res.data.meta.perPage;
    const delay = fullPage ? pollWait : pollIdleWait;
    const lastEvent = events[events.length - 1];
    const lastSequenceId = lastEvent ? lastEvent.attributes.sequenceId : sequenceId;

    // integrationSdk.listings
    //   .query({
    //     meta_reviewAvg: 2,
    //   })
    //   .then(res => {
    //     console.log('Res:', JSON.stringify(res.data.data));
    //   })
    //   .catch(err => {
    //     console.log('err: ', err);
    //   });
    // let review = Math.floor(Math.random() * 5) + 1;
    // count =  count + 1;
    // let count, avg, calculatedAvg;
    // let newRatting = Math.floor(Math.random() * 5) + 1;
    // integrationSdk.listings
    //   .open(
    //     {
    //       id: '614efaee-30e1-4a7c-96c0-23299940af97',
    //     },
    //     {
    //       expand: true,
    //     }
    //   )
    //   .then(res => {
    //     let metaData = res.data.data.attributes.metadata;
    //     if (metaData) {
    //       count = metaData.reviewCount ? metaData.reviewCount : 1;
    //       avg = metaData.reviewAvg ? metaData.reviewAvg : 0;
    //       let sum = newRatting + avg * count;
    //       count = count + 1;
    //       calculatedAvg = Math.round(sum / count);
    //       integrationSdk.listings
    //         .update(
    //           {
    //             id: '614efaee-30e1-4a7c-96c0-23299940af97',
    //             metadata: { reviewCount: count, reviewAvg: calculatedAvg },
    //           },
    //           {
    //             expand: true,
    //           }
    //         )
    //         .then(res => {
    //           console.log('Res:', res);
    //         })
    //         .catch(err => {
    //           console.log('err: ', err);
    //         });
    //     }
    //   });

    events.forEach(e => {
      handleEvent(e);
    });

    setTimeout(() => {
      pollLoop(lastSequenceId);
    }, delay);
  });
};

// Load state from local file, if any
const lastSequenceId = loadLastEventSequenceId();

// kick off the polling loop
pollLoop(lastSequenceId);
