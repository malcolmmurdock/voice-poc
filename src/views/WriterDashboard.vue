<template>
  <div>
    <!-- <div class="text-center">
      <v-btn
        hidden="true"
        id="uppyModalOpenerButton"
        color="primary"
        class="ma-2 white--text"
      >
        Upload New Recording
        <v-icon right dark> mdi-cloud-upload </v-icon>
      </v-btn>
    </div> -->
    <v-sheet outlined class="mb-6 pa-2">
      <!-- <h3>Upload New Recording</h3> -->
      <div>
        <div id="uppyDashboard"></div>
      </div>
    </v-sheet>
    <div>
      <v-sheet outlined elevation="1" class="pa-2">
        <h1>Recent Uploads</h1>

        <recording
          v-for="recording in recordings"
          v-bind:key="recording.id"
          v-bind:recDate="recording.recDate"
          v-bind:recTitle="recording.recTitle"
          v-bind:recTranscript="recording.recTranscript"
          v-bind:skeletonTranscript="recording.skeletonTranscript"
        />
        <v-divider></v-divider>
        <div id="rec-pages" class="d-flex mb-4">
          <v-btn
            text
            v-bind:disabled="!beforeNavExists"
            color="primary"
            class="text-decoration-none text-body-1"
            v-on:click="recNavTo('before')"
          >
            <span class="text-h6 text--primary">←&nbsp;</span>
            <span>Previous 10</span>
          </v-btn>
          <div class="spacer"></div>
          <v-btn
            text
            v-bind:disabled="!afterNavExists"
            color="primary"
            class="text-decoration-none text-body-1"
            v-on:click="recNavTo('after')"
          >
            <span>Next 10</span>
            <span class="text-h6 text--primary">&nbsp;→</span>
          </v-btn>
        </div>
      </v-sheet>
    </div>
  </div>
</template>

<script>
import Robodog from "@uppy/robodog";
import { mapGetters } from "vuex";
import jwt_decode from "jwt-decode";
import Recording from "../components/Recording.vue";
import apiCalls from "../mixins/apiCalls.js";

require("@uppy/core/dist/style.css");
require("@uppy/dashboard/dist/style.css");

var UPLOAD_KEYS = {};

const notifyURL =
  process.env.NODE_ENV == "development"
    ? "http://5867-204-128-192-33.ngrok.io"
    : "https://boring-varahamihira-cc7a90.netlify.app";

// const TRANSLOADIT_KEY = process.env.TRANSLOADIT_KEY;
// const TRANSLOADIT_TEMPLATE_ID = process.env.TRANSLOADIT_TEMPLATE_ID;
// console.log(TRANSLOADIT_KEY);

export default {
  name: "WriterDashboard",
  mixins: [apiCalls],
  data: () => ({
    // recordings: {
    //   recDate: null,
    //   recTitle: null,
    // },
    recordings: [],
    recsNav: {},
    interval: null,
  }),
  components: {
    Recording,
  },
  computed: {
    ...mapGetters("user", ["getUser"]),
    beforeNavExists: function () {
      if (this.recsNav.hasOwnProperty("before")) {
        if (this.recsNav.before.length > 0) {
          return true;
        }
      }
      return false;
    },
    afterNavExists: function () {
      if (this.recsNav.hasOwnProperty("after")) {
        console.log("has after");
        if (this.recsNav["after"].length > 0) {
          console.log("has after and length");
          return true;
        }
      }
      return false;
    },
  },
  created: function created() {
    this.fetchUploadKeys();
  },
  mounted: function mounted() {
    this.initUppy();
    const uppyInnerElement = document.getElementsByClassName(
      "uppy-Dashboard-inner"
    );
    uppyInnerElement[0].className = "uppy-Dashboard-inner mx-auto";
    console.log(uppyInnerElement);
    console.log("mounted");
    // console.log(this.getUser.access_token);
    console.log(this.userAuthToken());
    // const decoded = jwt_decode(this.getUser.access_token);
    const decoded = jwt_decode(this.userAuthToken());
    console.log(decoded);
    console.log(decoded.sub);
    // console.log(jwt_decode(this.getUser.access_token).sub);
    console.log(jwt_decode(this.userAuthToken()).sub);
    this.fetchRecordings();
    // this.recordings.push({
    //   key: 2,
    //   recDate: "March 2, 2022",
    //   keyTitle: "Ethan Arrives",
    // });
  },
  watch: {},
  methods: {
    recNavTo: function (selector) {
      var cursor =
        selector == "before" ? this.recsNav.before : this.recsNav.after;
      console.log(selector, cursor);
      if (selector == "before") {
        this.fetchRecordings(cursor, null);
      } else {
        this.fetchRecordings(null, cursor);
      }
    },
    fetchUploadKeys() {
      fetch("/.netlify/functions/uploadKeyAndID/", {
        headers: {
          // Authorization: "Bearer " + this.getUser.access_token,
          Authorization: "Bearer " + this.userAuthToken(),
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw response.statusText;
          }
        })
        .then((data) => {
          UPLOAD_KEYS = data;
          console.log(UPLOAD_KEYS);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    initUppy() {
      const uppy = Robodog.dashboard("#uppyDashboard", {
        inline: true,
        waitForEncoding: true,
        height: 200,
        getAssemblyOptions(file) {
          return {
            params: {
              auth: { key: `${UPLOAD_KEYS.TRANSLOADIT_KEY}` },
              template_id: `${UPLOAD_KEYS.TRANSLOADIT_TEMPLATE_ID}`,
              notify_url: `${notifyURL}/.netlify/functions/onboardRecording`,
            },
            fields: {
              netlifyUserToken: file.meta.netlifyUserToken,
              netlifyID: file.meta.netlifyID,
              filePrefix: file.meta.filePrefix,
            },
          };
        },
        // params: {
        //   // To avoid tampering, use Signature Authentication
        //   auth: { key: `${UPLOAD_KEYS.TRANSLOADIT_KEY}` },
        //   template_id: `${UPLOAD_KEYS.TRANSLOADIT_TEMPLATE_ID}`,
        //   // auth: { key: "58780b415f124c0f99f6da702e762ad7" },
        //   // template_id: "12cb3d91ded94271a7345c43b4784972",
        // }
      });
      uppy.on("upload-success", (file, resp) => {
        console.log("upload-success");
        // console.log(JSON.stringify(file, null, 2));
        // console.log(JSON.stringify(resp, null, 2));
      });
      uppy.on("complete", (result) => {
        console.log("complete");
        console.log(JSON.stringify(result, null, 2));
        // Format data for display
        const options = { year: "numeric", month: "long", day: "numeric" };
        const today = new Date();
        const dateStr = today.toLocaleDateString("en-US", options);
        // const resObj = JSON.parse(result);
        const uploadedFileName = result.transloadit[0].uploads[0].name;
        const filePrefix = result.transloadit[0].fields.filePrefix;
        console.log(`Recording date : ${dateStr}`);
        console.log(`Recording Title : ${uploadedFileName}`);
        console.log(`filePrefix : ${filePrefix}`);

        this.recordings.unshift({
          // id: 3,
          recDate: dateStr,
          recTitle: uploadedFileName,
          skeletonTranscript: true,
        });
        // Start polling for transcript
        this.pollForTranscript(filePrefix);
        this.interval = setInterval(() => {
          // console.log(`filePrefix : ${filePrefix}`);
          this.pollForTranscript(filePrefix);
        }, 5000);
      });
      uppy.on("file-added", (file) => {
        console.log("File added");
        // const niid = jwt_decode(this.getUser.access_token).sub;
        const niid = jwt_decode(this.userAuthToken()).sub;
        const timeStamp = Date.now();
        const prefix = `${niid.replaceAll("-", "_")}__${timeStamp}`;
        console.log(`filePrefix: ${prefix}`);
        uppy.setFileMeta(file.id, {
          netlifyUserToken: this.getUser.access_token, // TODO I think this may be wrong and should be an immutable user ID? The access_token changes over time (every hour!)... Oh or maybe this is passing the entire JWT, which would include immutable and mutable characteristics both (e.g. user ID vs auth_token). Just need to ensure I'm not persisting anything in db or doing aws stuff relying on the consistency of a mutable value...
          netlifyID: niid,
          filePrefix: prefix,
        });
      });
    },
    fetchRecordings(before = null, after = null) {
      fetch("/.netlify/functions/fetchUserRecordings", {
        method: "POST",
        headers: {
          // Authorization: "Bearer " + this.getUser.access_token,
          Authorization: "Bearer " + this.userAuthToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          before: before,
          after: after,
        }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw response.statusText;
          }
        })
        .then((data) => {
          console.log(data);
          this.loadRecordings(data);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    loadRecordings(data) {
      var recs = [];
      console.log(typeof data.data);
      data.data.forEach((item) => {
        console.log(item);
        recs.push({
          id: Date.parse(item[0]["@ts"]),
          recDate: item[0]["@ts"].substring(0, 10),
          recTitle: item[1],
          recTranscript: item[2],
          skeletonTranscript: false,
        });
      });
      this.recordings = recs;
      // recs.forEach((item) => recordingsRef.push(item));
      if (data.hasOwnProperty("before") && data.before.length > 0) {
        this.$set(this.recsNav, "before", data.before);
      } else {
        this.$set(this.recsNav, "before", "");
      }
      if (data.hasOwnProperty("after") && data.after.length > 0) {
        this.$set(this.recsNav, "after", data.after);
      } else {
        this.$set(this.recsNav, "after", "");
      }
      if (data.hasOwnProperty("cursors")) {
        this.$set(this.recsNav, "cursors", data.cursors);
      }
    },
    pollForTranscript: function (filePrefix) {
      console.log("polling");
      fetch("/.netlify/functions/fetchRecordingUpdates", {
        method: "POST",
        headers: {
          // Authorization: "Bearer " + this.getUser.access_token,
          Authorization: "Bearer " + this.userAuthToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePrefix: `${filePrefix}`,
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          console.log("Data : ", data);
          this.testResponse = data;
          switch (data.status) {
            case "DNE":
            case "transcribing":
              console.log("waiting for transcript...");
              break;
            case "complete":
              let newData = {
                id: Date.parse(data.date["@ts"]),
                recTranscript: data.transcript,
                skeletonTranscript: false,
              };
              Object.assign(this.recordings[0], newData);
              clearInterval(this.interval);
              var tmp_cursors = this.recsNav.cursors;
              tmp_cursors.unshift(data.cursor);
              tmp_cursors.pop();
              this.$set(this.recsNav, "cursors", tmp_cursors);
              this.$set(
                this.recsNav,
                "after",
                this.recsNav.cursors[this.recsNav.cursors.length - 1]
              );
          }
        })
        .catch((err) => {
          console.error("Err : ", err);
        });
    },
  },
  beforeDestroy: function () {
    clearInterval(this.interval);
  },
};
</script>
<style scoped>
.uppy-Dashboard-inner {
  margin-right: auto !important;
  margin-left: auto !important;
}
</style>