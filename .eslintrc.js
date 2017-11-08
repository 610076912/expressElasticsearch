// http://eslint.org/docs/user-guide/configuring

module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "standard",
    "rules": {
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "never"
        ]
    }
};
