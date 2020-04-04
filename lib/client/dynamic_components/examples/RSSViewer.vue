<!--
 * Copyright 2019 Padmanabh Dabke. All Rights Reserved.
 *
 * Distributed under MIT license
 * https://opensource.org/licenses/MIT
 * 
 -->

<template>
  <div v-if="error" class="sp-error">{{$i18n(error)}}</div>
  <sp-spinner v-else-if="!loaded"></sp-spinner>
  <ul v-else class="list-group list-group-flush">
    <li v-for="hl in headlines" :key="hl.id" class="list-group-item">
      <div class="bm-1">
      <a :href="hl.link" target="_blank">{{hl.title}}</a>
      <br />
      <span class="small">{{hl.pubDate}}</span>
      </div>
      <div v-html="hl.description"></div>
      <div class="text-center py-2 " v-if="hl.enclosure">
        <audio v-if="hl.enclosure['@attributes'].type && hl.enclosure['@attributes'].type.startsWith('audio')"
          controls :src="hl.enclosure['@attributes'].url" :type="hl.enclosure['@attributes'].type">Your browser does not support embedded audio.</audio>
        <embed v-else
          controls :src="hl.enclosure['@attributes'].url" :type="hl.enclosure['@attributes'].type">
      </div>
    </li>
    <li v-if="copyright" class="list-group-item small" v-html="copyright">
    </li>
  </ul>
</template>
<script>
"use strict";
export default {
  props: ["feedUrl"],

  watch: {
    feedUrl: function(newf, oldf) {
      this.loadFeed();
    }
  },

  data: function() {
    return {
      loaded: false,
      error: null,
      headlines: [],
      copyright: null,
      currentLocale: [
        "just now",
        ["%ss", "%ss"],
        ["%sm", "%sm"],
        ["%sh", "%sh"],
        ["%sd", "%sd"],
        ["%sw", "%sw"],
        ["%sm", "%sm"],
        ["%sy", "%sy"]
      ],
      messages: {
        "en-US": {
          "error_domain_fetch_not_allowed": "Please contact your portal administrator to enable access to the current feed URL domain.",
          "error_failed_to_fetch_url": "Sorry! Could not fetch content from the feed URL."
        }
      }
    };
  },

  mounted: function() {
    this.loadFeed();
  },

  methods: {
    linkify: function(str) {
      return anchorme(str);
    },
    loadFeed: function() {
      this.loading = true;
      this.error = null;
      let url = this.feedUrl
        ? this.feedUrl
        : "https://www.npr.org/rss/podcast.php?id=510298";
      this.$app.rpc.invoke('URLFetcher', 'fetch', { url: url}, this.fetchSuccess.bind(this), this.fetchError);
    },

    fetchSuccess: function(responseTxt) {
            
      try {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(responseTxt, "text/xml");
        var title = xmlDoc.getElementsByTagName("title")[0].childNodes[0]
          .nodeValue;
        var items = xmlDoc.getElementsByTagName("item");
        var articles = [];
        var len = items.length > 5 ? 5 : items.length;
        for (let ii = 0; ii < len; ii++) {
          let item = this.xmlToJson(items[ii]);
          if (!item.pubDate) item.pubDate = item['dc:date'];
          item.id = ii;
          articles.push(item);
        }
        var cr = xmlDoc.getElementsByTagName("copyright");
        if (cr.length > 0) this.copyright = cr[0].textContent;

        this.headlines = articles;
        this.$emit("update:title", title);
        this.loaded = true;
      } catch (e) {
        console.log(e);
        this.error = e;
      }
    },

    fetchError: function(status, errorMsg /*,  result */) {
      this.error = errorMsg;
      this.loading = false;
    },

    timeAgo: function(time) {
      const MINUTE = 60;
      const HOUR = MINUTE * 60;
      const DAY = HOUR * 24;
      const WEEK = DAY * 7;
      const MONTH = DAY * 30;
      const YEAR = DAY * 365;
      var postTime = new Date(time).getTime();
      const seconds = new Date().getTime() / 1000 - postTime / 1000;

      if (seconds > 864000) {
        return new Date(time).toLocaleString();
      }
      const ret =
        seconds <= 5
          ? this.pluralOrSingular("just now", this.currentLocale[0])
          : seconds < MINUTE
          ? this.pluralOrSingular(seconds, this.currentLocale[1])
          : seconds < HOUR
          ? this.pluralOrSingular(seconds / MINUTE, this.currentLocale[2])
          : seconds < DAY
          ? this.pluralOrSingular(seconds / HOUR, this.currentLocale[3])
          : seconds < WEEK
          ? this.pluralOrSingular(seconds / DAY, this.currentLocale[4])
          : seconds < MONTH
          ? this.pluralOrSingular(seconds / WEEK, this.currentLocale[5])
          : seconds < YEAR
          ? this.pluralOrSingular(seconds / MONTH, this.currentLocale[6])
          : this.pluralOrSingular(seconds / YEAR, this.currentLocale[7]);

      return ret;
    },
    pluralOrSingular: function(data, locale) {
      if (data === "just now") {
        return locale;
      }
      const count = Math.round(data);
      if (Array.isArray(locale)) {
        return count > 1
          ? locale[1].replace(/%s/, count)
          : locale[0].replace(/%s/, count);
      }
      return locale.replace(/%s/, count);
    },
    xmlToJson: function(xml) {
      if (
        xml.hasChildNodes() &&
        xml.childNodes.length == 1 &&
        (xml.childNodes.item(0).nodeName == "#text" || xml.childNodes.item(0).nodeName == "#cdata-section")
      ) {
        return xml.childNodes.item(0).textContent;
      }
      var obj = {};

      if (xml.nodeType == 1) {
        // element
        // do attributes
        if (xml.attributes.length > 0) {
          obj["@attributes"] = {};
          for (let j = 0; j < xml.attributes.length; j++) {
            var attribute = xml.attributes.item(j);
            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
          }
        }
      } else if (xml.nodeType == 3) {
        // text
        obj = xml.nodeValue;
      }

      // do children
      if (xml.hasChildNodes()) {
        for (let i = 0; i < xml.childNodes.length; i++) {
          var item = xml.childNodes.item(i);
          var nodeName = item.nodeName;
          if (typeof obj[nodeName] == "undefined") {
            obj[nodeName] = this.xmlToJson(item);
          } else {
            if (typeof obj[nodeName].push == "undefined") {
              var old = obj[nodeName];
              obj[nodeName] = [];
              obj[nodeName].push(old);
            }
            obj[nodeName].push(this.xmlToJson(item));
          }
        }
      }
      return obj;
    }
  }
};
</script>