/**
 * [OTP Generation]
 *
 * @author  KenKem
 * @version 3.55PM 14-Dec-17
 * @reference http://blog.tinisles.com/2011/10/google-authenticator-one-time-password-algorithm-in-javascript/
 */

var authenKey = "";

function dec2hex(s) { return (s < 15.5 ? '0' : '') + Math.round(s).toString(16); }
function hex2dec(s) { return parseInt(s, 16); }

function base32tohex(base32) {
	var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	var bits = "";
	var hex = "";

	for (var i = 0; i < base32.length; i++) {
		var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
		bits += leftpad(val.toString(2), 5, '0');
	}

	for (var i = 0; i+4 <= bits.length; i+=4) {
		var chunk = bits.substr(i, 4);
		hex = hex + parseInt(chunk, 2).toString(16) ;
	}
	return hex;
}

function leftpad(str, len, pad) {
	if (len + 1 >= str.length) {
		str = Array(len + 1 - str.length).join(pad) + str;
	}
	return str;
}

function updateOtp() {
	var jump = Math.round(new Date().getTime() / 1000.0);
	for (i = 0; i < 120; i++) {
		var key = base32tohex(authenKey);
		if (i>0){
			jump = jump + 30;
		}
		var date = new Date(jump*1000);
		console.log(date);
		var time = leftpad(dec2hex(Math.floor(jump / 30)), 16, '0');
		var shaObj = new jsSHA("SHA-1", "HEX");
		shaObj.setHMACKey(key, "HEX");
		shaObj.update(time);
		var hmac = shaObj.getHMAC("HEX");
		
		var offset = hex2dec(hmac.substring(hmac.length - 1));
		var part1 = hmac.substr(0, offset * 2);
		var part2 = hmac.substr(offset * 2, 8);
		var part3 = hmac.substr(offset * 2 + 8, hmac.length - offset);

		var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
		otp = (otp).substr(otp.length - 6, 6);
		chrome.extension.getBackgroundPage().console.log(otp);
	}
	console.log("-------------block-------------");
}

function timer() {
	chrome.storage.sync.get('keys', function(data) {
		if (data.keys != null && data.keys != ""){
			var epoch = Math.round(new Date().getTime() / 1000.0);
			var countDown = 30 - (epoch % 30);
			if (epoch % 30 == 0) updateOtp();
		}
	});
}

var wait = setInterval(function(){
	chrome.storage.sync.get('keys', function(data) {
		authenKey = data.keys;
		if (authenKey != null && authenKey != ""){
			clearInterval(wait);
			console.log(authenKey)
			updateOtp();
			setInterval(timer, 1000);
		}
	});
},2000);