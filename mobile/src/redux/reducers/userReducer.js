// User Reducer
const initialState = {
  profile: null,
  loading: false,
  error: null
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_PROFILE_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'GET_PROFILE_SUCCESS':
      return {
        ...state,
        profile: action.payload,
        loading: false,
        error: null
      };
    
    case 'GET_PROFILE_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'UPDATE_PROFILE_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'UPDATE_PROFILE_SUCCESS':
      return {
        ...state,
        profile: action.payload,
        loading: false,
        error: null
      };
    
    case 'UPDATE_PROFILE_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'CLEAR_USER_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

export default userReducer;
