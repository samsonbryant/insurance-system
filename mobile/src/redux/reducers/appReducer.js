// App Reducer
const initialState = {
  isOnline: true,
  loading: false,
  error: null,
  theme: 'light',
  language: 'en',
  notifications: [],
  permissions: {
    camera: false,
    location: false,
    storage: false
  }
};

const appReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload
      };
    
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload
      };
    
    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: []
      };
    
    case 'SET_PERMISSION':
      return {
        ...state,
        permissions: {
          ...state.permissions,
          [action.payload.permission]: action.payload.granted
        }
      };
    
    case 'SET_ALL_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload
      };
    
    default:
      return state;
  }
};

export default appReducer;
