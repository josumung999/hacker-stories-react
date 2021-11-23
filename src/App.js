import React from 'react';
import axios from 'axios'
import styled from 'styled-components';

import SearchForm from './SearchForm';
import List from './List';
import InputWithLabel from './InputWithLabel';


const useSemiPersistentState = (key, initialState) => {
  const isMounted = React.useRef(false);

  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  );

  React.useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    } else {
      localStorage.setItem(key, value);
    }
  }, [value, key]);

  return [value, setValue];
};

// Using useReducer instead of useState

const storiesReducer = (state, action) => {
  switch (action.type) {
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      }
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      }
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      }
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(
          story => action.payload.objectID !== story.objectID
        ),
      }
    default:
      throw new Error();
  }
}


// Data Fetching from real API
// Step 1
const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

// Styling the app with Styled Components
const StyledContainer = styled.div`
  height: 100vw;
  padding: 20px;

  background: #83a4d4;
  background: linear-gradient(to left, #b6fbff, #83a4d4);

  color: #171212;
`;

const StyledHeadlinePrimary = styled.h1`
  font-size: 48px;
  font-weight: 300;
  letter-spacing: 2px;
`;



// Getting the sum of comments
const getSumComments = stories => {
  console.log('C');

  return stories.data.reduce(
   (result, value) => result + value.num_comments,
   0 
  );
};


const App = () => {
  const [searchTerm, setSearchTerm] = useSemiPersistentState(
    'search',
    'React'
  );

  const [url, setUrl] = React.useState(
    `${API_ENDPOINT}${searchTerm}`
  );

  const [stories, dispatchStories] = React.useReducer(
    storiesReducer,
    { data: [], isLoading: false, isError: false }
  );
  
  // Setting up Memoized handler for learning purpose
  // Step A
  const handleFetchStories = React.useCallback( async () => {
    dispatchStories({ type: 'STORIES_FETCH_INIT' });

    try {
      const result = await axios.get(url);

      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits
      })
    } catch {
      dispatchStories({ type: 'STORIES_FETCH_FAILURE' })
    }
    
  }, [url]); // Step E

  React.useEffect(() => {
    handleFetchStories(); // Step C
  }, [handleFetchStories]); // Step D

  const handleRemoveStory = React.useCallback(item => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    });
  }, []);

  const handleSearchInput = event => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = event => {
    setUrl(`${API_ENDPOINT}${searchTerm}`)

    event.preventDefault();
  }

  console.log('B:App');

  const sumComments = React.useMemo(() => getSumComments(stories), [
    stories,
  ]);

  return (
    <StyledContainer>
      <StyledHeadlinePrimary>My Hacker Stories with {sumComments} comments </StyledHeadlinePrimary>

      <SearchForm 
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />

      {stories.isError && <p>Something went wrong ...</p>}

      { stories.isLoading ? (
        <p>Loading ...</p>
      ) : (
        <List 
          list={stories.data}
          onRemoveItem={handleRemoveStory}
        />
      )}
    </StyledContainer>
  );
};



export default App;

export { SearchForm, InputWithLabel, List };