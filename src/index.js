import * as utils from './utils';

// get from whatever version of react native that is being used.
import MMKVStorage from "react-native-mmkv-storage";

function getDefaults() {
  return {
    prefix: 'i18next_res_',
    expirationTime: 7 * 24 * 60 * 60 * 1000,
    versions: {}
  };
}

class Cache {
  constructor(services, options = {}) {
    this.init(services, options);

    this.type = 'backend';
  }

  init(services, options = {}) {
    this.services = services;
    this.options = utils.defaults(options, this.options || {}, getDefaults());
    if(options.instance){
      this.MMKV = options.instance;
    }else{
       this.MMKV = new MMKVStorage.Loader().initialize();
    }

  }

  read(language, namespace, callback) {
    const store = {};
    const nowMS = new Date().getTime();

    if (!this.MMKV) {
      return callback(null, null);
    }

    this.MMKV.getString(`${this.options.prefix}${language}-${namespace}`)
      .then(local => {
        if (local) {
          local = JSON.parse(local);
          if (
            // expiration field is mandatory, and should not be expired
            local.i18nStamp && local.i18nStamp + this.options.expirationTime > nowMS &&

            // there should be no language version set, or if it is, it should match the one in translation
            this.options.versions[language] === local.i18nVersion
          ) {
            delete local.i18nVersion;
            delete local.i18nStamp;
            return callback(null, local);
          }
        }

        callback(null, null);
      })
      .catch(err => {
        console.warn(err);
        callback(null, null);
      });
  }

  save(language, namespace, data) {
    if (this.MMKV) {
      data.i18nStamp = new Date().getTime();

      // language version (if set)
      if (this.options.versions[language]) {
        data.i18nVersion = this.options.versions[language];
      }

      // save
      this.MMKV.setString(`${this.options.prefix}${language}-${namespace}`, JSON.stringify(data));
    }
  }
}

Cache.type = 'backend';

export default Cache;
