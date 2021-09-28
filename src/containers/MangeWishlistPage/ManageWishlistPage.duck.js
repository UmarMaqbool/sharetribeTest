import {
  updatedEntities,
  denormalisedEntities,
  denormalisedResponseEntities,
} from '../../util/data';
import { storableError } from '../../util/errors';
import { fetchCurrentUser, currentUserShowSuccess } from '../../ducks/user.duck';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';

// Pagination page size might need to be dynamic on responsive page layouts
// Current design has max 3 columns 42 is divisible by 2 and 3
// So, there's enough cards to fill all columns on full pagination pages
const RESULT_PAGE_SIZE = 42;

// ================ Action types ================ //
export const FETCH_WISHLIST_REQUEST = 'app/ManageWishlistPage/FETCH_WISHLIST_REQUEST';
export const FETCH_WISHLIST_SUCCESS = 'app/ManageWishlistPage/FETCH_WISHLIST_SUCCESS';
export const FETCH_WISHLIST_ERROR = 'app/ManageWishlistPage/FETCH_WISHLIST_ERROR';

export const FETCH_LISTINGS_REQUEST = 'app/ManageListingsPage/FETCH_LISTINGS_REQUEST';
export const FETCH_LISTINGS_SUCCESS = 'app/ManageListingsPage/FETCH_LISTINGS_SUCCESS';
export const FETCH_LISTINGS_ERROR = 'app/ManageListingsPage/FETCH_LISTINGS_ERROR';

export const OPEN_LISTING_REQUEST = 'app/ManageListingsPage/OPEN_LISTING_REQUEST';
export const OPEN_LISTING_SUCCESS = 'app/ManageListingsPage/OPEN_LISTING_SUCCESS';
export const OPEN_LISTING_ERROR = 'app/ManageListingsPage/OPEN_LISTING_ERROR';

export const CLOSE_LISTING_REQUEST = 'app/ManageListingsPage/CLOSE_LISTING_REQUEST';
export const CLOSE_LISTING_SUCCESS = 'app/ManageListingsPage/CLOSE_LISTING_SUCCESS';
export const CLOSE_LISTING_ERROR = 'app/ManageListingsPage/CLOSE_LISTING_ERROR';
export const RESET = 'app/ManageListingsPage/RESET';

export const ADD_Wishlist_REQUEST = 'app/ManageWishlistPage/ADD_Wishlist_REQUEST';
export const ADD_Wishlist_SUCCESS = 'app/ManageWishlistPage/ADD_Wishlist_SUCCESS';
export const ADD_Wishlist_ERROR = 'app/ManageWishlistPage/ADD_Wishlist_ERROR';
export const REMOVE_WISHLIST_ITEM = 'app/ManageWishlistPage/REMOVE_WISHLIST_ITEM';
// ================ Reducer ================ //

const initialState = {
  pagination: null,
  queryParams: null,
  queryInProgress: false,
  queryListingsError: null,
  currentPageResultIds: [],
  openingListing: null,
  openingListingError: null,
  closingListing: null,
  closingListingError: null,
};
const resultIds = data => data.data.map(l => l.id);
const manageWishlistPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case FETCH_WISHLIST_REQUEST:
      return {
        ...state,
        queryParams: payload.queryParams,
        queryInProgress: true,
        queryListingsError: null,
        currentPageResultIds: [],
      };
    case FETCH_WISHLIST_SUCCESS:
      console.log('payload.data.meta:', payload.data.meta);
      return {
        ...state,
        currentPageResultIds: resultIds(payload.data),
        pagination: payload.data.meta,
        queryInProgress: false,
      };
    case REMOVE_WISHLIST_ITEM:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          totalItems: payload.length,
        },
        currentPageResultIds: [
          ...payload.map(id => ({
            uuid: id,
          })),
        ],
      };
    case RESET:
      return {
        ...state,
        queryInProgress: false,
        pagination: {
          totalItems: 0,
        },
      };
    case FETCH_WISHLIST_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, queryInProgress: false, queryListingsError: payload };

    case OPEN_LISTING_REQUEST:
      return {
        ...state,
        openingListing: payload.listingId,
        openingListingError: null,
      };
    case OPEN_LISTING_SUCCESS:
      return {
        ...updateListingAttributes(state, payload.data),
        openingListing: null,
      };
    case OPEN_LISTING_ERROR: {
      // eslint-disable-next-line no-console
      console.error(payload);
      return {
        ...state,
        openingListing: null,
        openingListingError: {
          listingId: state.openingListing,
          error: payload,
        },
      };
    }

    case CLOSE_LISTING_REQUEST:
      return {
        ...state,
        closingListing: payload.listingId,
        closingListingError: null,
      };
    case CLOSE_LISTING_SUCCESS:
      return {
        ...updateListingAttributes(state, payload.data),
        closingListing: null,
      };
    case CLOSE_LISTING_ERROR: {
      // eslint-disable-next-line no-console
      console.error(payload);
      return {
        ...state,
        closingListing: null,
        closingListingError: {
          listingId: state.closingListing,
          error: payload,
        },
      };
    }

    default:
      return state;
  }
};

export default manageWishlistPageReducer;

// ================ Action creators ================ //

// This works the same way as addMarketplaceEntities,
// but we don't want to mix own listings with searched listings
// (own listings data contains different info - e.g. exact location etc.)

export const openListingRequest = listingId => ({
  type: OPEN_LISTING_REQUEST,
  payload: { listingId },
});

export const openListingSuccess = response => ({
  type: OPEN_LISTING_SUCCESS,
  payload: response.data,
});

export const openListingError = e => ({
  type: OPEN_LISTING_ERROR,
  error: true,
  payload: e,
});

export const closeListingRequest = listingId => ({
  type: CLOSE_LISTING_REQUEST,
  payload: { listingId },
});

export const closeListingSuccess = response => ({
  type: CLOSE_LISTING_SUCCESS,
  payload: response.data,
});

export const closeListingError = e => ({
  type: CLOSE_LISTING_ERROR,
  error: true,
  payload: e,
});

export const findWishListRequest = queryParams => ({
  type: FETCH_WISHLIST_REQUEST,
  payload: { queryParams },
});

export const findWishListSuccess = response => ({
  type: FETCH_WISHLIST_SUCCESS,
  payload: { data: response.data },
});
export const nodata = response => ({
  type: RESET,
});

export const findWishListError = e => ({
  type: FETCH_WISHLIST_ERROR,
  error: true,
  payload: e,
});
export const removeWishList = e => ({
  type: REMOVE_WISHLIST_ITEM,
  payload: e,
});

// Throwing error for new (loadData may need that info)

// ================ Thunks ================ //

/**
 * Add Wishlist to the current user private data
 */
export const AddWishlistToCurrentuser = queryParams => (dispatch, getState, sdk) => {
  const wishListID = queryParams.whislist_id;

  return dispatch(fetchCurrentUser()).then(() => {
    const currentUser = getState().user.currentUser;
    let wishlists = {};
    if (currentUser) {
      let ids = currentUser.attributes.profile.privateData?.wishlists?.ids;
      if (!ids) {
        wishlists = {
          ids: [wishListID],
        };
      } else {
        wishlists = {
          ids: [...ids, wishListID],
        };
      }

      return sdk.currentUser
        .updateProfile(
          { privateData: { wishlists } },
          {
            expand: true,
            include: ['profileImage'],
            'fields.image': ['variants.square-small', 'variants.square-small2x'],
          }
        )
        .then(response => {
          const entities = denormalisedResponseEntities(response);
          if (entities.length !== 1) {
            throw new Error('Expected a resource in the sdk.currentUser.updateProfile response');
          }

          const user = entities[0];
          dispatch(currentUserShowSuccess(user));
        })
        .catch(e => {
          //dispatch(savePhoneNumberError(storableError(e)));
          // pass the same error so that the SAVE_CONTACT_DETAILS_SUCCESS
          // action will not be fired
          throw e;
        });
    }
  });
};

/**
 * Add Wishlist to the current user private data
 */
export const removeWishlistFromUser = queryParams => (dispatch, getState, sdk) => {
  const wishListID = queryParams.whislist_id;

  return dispatch(fetchCurrentUser()).then(() => {
    const currentUser = getState().user.currentUser;
    let wishlists = {};
    if (currentUser) {
      let ids = currentUser.attributes.profile.privateData?.wishlists?.ids;
      let filterdIds = ids.filter(id => id != wishListID);
      wishlists = {
        ids: filterdIds,
      };
      dispatch(removeWishList(filterdIds));
      return sdk.currentUser
        .updateProfile(
          { privateData: { wishlists } },
          {
            expand: true,
            include: ['profileImage'],
            'fields.image': ['variants.square-small', 'variants.square-small2x'],
          }
        )
        .then(response => {
          const entities = denormalisedResponseEntities(response);
          if (entities.length !== 1) {
            throw new Error('Expected a resource in the sdk.currentUser.updateProfile response');
          }

          const user = entities[0];
          dispatch(currentUserShowSuccess(user));
        })
        .catch(e => {
          //dispatch(savePhoneNumberError(storableError(e)));
          // pass the same error so that the SAVE_CONTACT_DETAILS_SUCCESS
          // action will not be fired
          throw e;
        });
    }
  });
};

export const closeListing = listingId => (dispatch, getState, sdk) => {
  dispatch(closeListingRequest(listingId));

  return sdk.ownListings
    .close({ id: listingId }, { expand: true })
    .then(response => {
      dispatch(closeListingSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(closeListingError(storableError(e)));
    });
};

export const openListing = listingId => (dispatch, getState, sdk) => {
  dispatch(openListingRequest(listingId));

  return sdk.ownListings
    .open({ id: listingId }, { expand: true })
    .then(response => {
      dispatch(openListingSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(openListingError(storableError(e)));
    });
};

const findWishlist = queryParams => (dispatch, getState, sdk) => {
  dispatch(findWishListRequest(queryParams));
  return dispatch(fetchCurrentUser()).then(() => {
    const currentUser = getState().user.currentUser;
    let params = {};
    if (currentUser) {
      let ids = currentUser.attributes.profile.privateData?.wishlists?.ids;
      if (ids.length) {
        params = { ids: [...ids], ...queryParams };
        return sdk.listings
          .query(params)
          .then(response => {
            dispatch(addMarketplaceEntities(response));
            dispatch(findWishListSuccess(response));
            return response;
          })
          .catch(e => {
            dispatch(findWishListError(storableError(e)));
            throw e;
          });
      } else {
        dispatch(nodata());
      }
    }
  });
};

export const loadData = () => {
  let page = 1;
  return findWishlist({
    page,
    perPage: RESULT_PAGE_SIZE,
    include: ['author', 'images'],
    'fields.listing': ['title', 'geolocation', 'price'],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    'fields.image': ['variants.landscape-crop', 'variants.landscape-crop2x'],
    'limit.images': 1,
  });
};
