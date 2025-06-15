import CryptoJS from "crypto-js";

const source = 'U2FsdGVkX18/05wsoiViD+55WpvqLYDV8oD/vD3Hw87LHbbxqPo5VK6IOH5lpv1ZAn7Xk1Q7nCCgDvvy5b2CjOx+5z3bAnUJGkKUEOri/fitItr9978hWxr7cLYiDMAgJ5rZnP7MS3jlqwWRVqUV3hwuxzCuSzlPcGk2xtyPp3L4bzu5KWHXTImuHnST9ZBRhFQiJ/SZDvFesdPcY7WfTCxcnT/tzIPp4asa/WRxSX3KIbFNczL6M9K5mgM7nTo+6aTIGSwsS/LDajg7lR57GcqmiI0mQBii4YN2X901nivHlZqfRpSDUw2BEi/MYSbPWpkcFGGi6iB1ILO4nhL9tXHnxqfNepDQmF+zcIc6k/Zu4dLWc2Zdeph0yQE335IMg/w2oK4iV10UEVMyqPKy12ao6Dzuh/i8QV8sY7HEid9XcYkeQqdQqNwvsV0RQm1cSI65EsxMwFmKRLipLXx6V7ZZJibsbPeuU6SH2x+WRDA6whoXkzslM0+/mzOwdtRmqm0AeEtXLoxruiHa6Y0+qQ=='
const key = '00ca3ef0caeb2ed1ee81e6565dc6aa8472b53536a4eb0e54b2b9d1cc1d98a04d';

const decrypted = CryptoJS.AES.decrypt(source, key);

const plaintext = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

console.log('Decrypted JSON:', plaintext);