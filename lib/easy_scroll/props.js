
export default {
    scroll: {
        type: String,
        default: 'xy',
        validator: (value) => ['x', 'y', 'xy'].includes(value)
    },
    joyStick: {
        type: Boolean,
        default: false
    },
    midMouseNav: {
        type: Boolean,
        default: false
    },
}