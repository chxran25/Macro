// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            'expo-router/babel',
            require('nativewind/babel').default, // <-- use the default export
            'react-native-reanimated/plugin',    // must be last
        ],
    };
};
