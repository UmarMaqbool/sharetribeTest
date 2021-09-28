import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { ListingCard, PaginationLinks } from '../../components';
import { AddWishlistToCurrentuser } from '../../containers/MangeWishlistPage/ManageWishlistPage.duck';
import css from './SearchResultsPanel.module.css';

const SearchResultsPanel = props => {
  const {
    className,
    rootClassName,
    listings,
    pagination,
    search,
    setActiveListing,
    currentUser,
    onSubmitAddWishlist,
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  const paginationLinks =
    pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="SearchPage"
        pageSearchParams={search}
        pagination={pagination}
      />
    ) : null;

  // Panel width relative to the viewport
  const panelMediumWidth = 50;
  const panelLargeWidth = 62.5;
  const cardRenderSizes = [
    '(max-width: 767px) 100vw',
    `(max-width: 1023px) ${panelMediumWidth}vw`,
    `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
    `${panelLargeWidth / 3}vw`,
  ].join(', ');

  return (
    <div className={classes}>
      <div className={css.listingCards}>
        {listings.map(l => (
          <ListingCard
            className={css.listingCard}
            key={l.id.uuid}
            listing={l}
            renderSizes={cardRenderSizes}
            setActiveListing={setActiveListing}
            onSelectAddToWishlist={values => {
              onSubmitAddWishlist(values);
            }}
            user={currentUser}
          />
        ))}
        {props.children}
      </div>
      {paginationLinks}
    </div>
  );
};

SearchResultsPanel.defaultProps = {
  children: null,
  className: null,
  listings: [],
  pagination: null,
  rootClassName: null,
  search: null,
};

const { array, node, object, string } = PropTypes;

SearchResultsPanel.propTypes = {
  children: node,
  className: string,
  listings: array,
  pagination: propTypes.pagination,
  rootClassName: string,
  search: object,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  //const {} = state.ManageWishlistPage;
  return {
    currentUser,
  };
};

const mapDispatchToProps = dispatch => ({
  onSubmitAddWishlist: values => dispatch(AddWishlistToCurrentuser(values)),
});

const SearchResults = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(SearchResultsPanel);
export default SearchResults;
