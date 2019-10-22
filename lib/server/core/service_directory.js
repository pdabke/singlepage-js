
var Services = {};
var InternalServices = {};

var ServiceDirectory = {
  setServices(s) {
    Services = s[0];
    InternalServices = s[1];
  },

  getService(name) {
    return Services[name];
  },

  getInternalService(name) {
    return InternalServices[name];
  }
}
module.exports = ServiceDirectory;