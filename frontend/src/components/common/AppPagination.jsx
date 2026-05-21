import ReactPaginate from "react-paginate";

const AppPagination = ({
  currentPage,
  pageCount,
  onPageChange,
  pageRangeDisplayed = 3,
  marginPagesDisplayed = 1,
}) => {
  if (pageCount <= 1) return null;

  return (
    <div className="pagination-block">
      <ReactPaginate
        breakLabel="..."
        nextLabel="Sau"
        previousLabel="Trước"
        onPageChange={({ selected }) => onPageChange(selected)}
        pageRangeDisplayed={pageRangeDisplayed}
        marginPagesDisplayed={marginPagesDisplayed}
        pageCount={pageCount}
        forcePage={currentPage}
        renderOnZeroPageCount={null}
        containerClassName="pagination"
        pageClassName="pagination__item"
        pageLinkClassName="pagination__link"
        previousClassName="pagination__item pagination__item--nav"
        previousLinkClassName="pagination__link pagination__link--nav"
        nextClassName="pagination__item pagination__item--nav"
        nextLinkClassName="pagination__link pagination__link--nav"
        breakClassName="pagination__item pagination__item--break"
        breakLinkClassName="pagination__link pagination__link--break"
        activeClassName="is-active"
        disabledClassName="is-disabled"
      />
    </div>
  );
};

export default AppPagination;
