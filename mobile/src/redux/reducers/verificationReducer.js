// Verification Reducer
const initialState = {
  verifications: [],
  currentVerification: null,
  verificationResult: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
};

const verificationReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_VERIFICATIONS_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'GET_VERIFICATIONS_SUCCESS':
      return {
        ...state,
        verifications: action.payload.verifications,
        pagination: action.payload.pagination,
        loading: false,
        error: null
      };
    
    case 'GET_VERIFICATIONS_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'VERIFY_DOCUMENT_REQUEST':
      return {
        ...state,
        loading: true,
        error: null,
        verificationResult: null
      };
    
    case 'VERIFY_DOCUMENT_SUCCESS':
      return {
        ...state,
        verificationResult: action.payload,
        verifications: [action.payload.verification, ...state.verifications],
        loading: false,
        error: null
      };
    
    case 'VERIFY_DOCUMENT_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        verificationResult: null
      };
    
    case 'GET_VERIFICATION_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'GET_VERIFICATION_SUCCESS':
      return {
        ...state,
        currentVerification: action.payload,
        loading: false,
        error: null
      };
    
    case 'GET_VERIFICATION_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'UPDATE_VERIFICATION_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'UPDATE_VERIFICATION_SUCCESS':
      return {
        ...state,
        verifications: state.verifications.map(verification => 
          verification.id === action.payload.id ? action.payload : verification
        ),
        currentVerification: action.payload,
        loading: false,
        error: null
      };
    
    case 'UPDATE_VERIFICATION_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'CLEAR_VERIFICATION_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'CLEAR_VERIFICATION_RESULT':
      return {
        ...state,
        verificationResult: null
      };
    
    case 'CLEAR_CURRENT_VERIFICATION':
      return {
        ...state,
        currentVerification: null
      };
    
    default:
      return state;
  }
};

export default verificationReducer;
