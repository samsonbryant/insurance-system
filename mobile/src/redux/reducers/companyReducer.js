// Company Reducer
const initialState = {
  companies: [],
  currentCompany: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
};

const companyReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_COMPANIES_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'GET_COMPANIES_SUCCESS':
      return {
        ...state,
        companies: action.payload.companies,
        pagination: action.payload.pagination,
        loading: false,
        error: null
      };
    
    case 'GET_COMPANIES_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'GET_COMPANY_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'GET_COMPANY_SUCCESS':
      return {
        ...state,
        currentCompany: action.payload,
        loading: false,
        error: null
      };
    
    case 'GET_COMPANY_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'REGISTER_COMPANY_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'REGISTER_COMPANY_SUCCESS':
      return {
        ...state,
        companies: [action.payload, ...state.companies],
        loading: false,
        error: null
      };
    
    case 'REGISTER_COMPANY_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'UPDATE_COMPANY_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'UPDATE_COMPANY_SUCCESS':
      return {
        ...state,
        companies: state.companies.map(company => 
          company.id === action.payload.id ? action.payload : company
        ),
        currentCompany: action.payload,
        loading: false,
        error: null
      };
    
    case 'UPDATE_COMPANY_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'CLEAR_COMPANY_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'CLEAR_CURRENT_COMPANY':
      return {
        ...state,
        currentCompany: null
      };
    
    default:
      return state;
  }
};

export default companyReducer;
