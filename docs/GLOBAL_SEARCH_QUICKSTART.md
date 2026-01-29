# Global Search - Quick Start Guide

## 🚀 How to Use

### Opening the Search
There are two ways to open the global search:

1. **Keyboard Shortcut** (Recommended)
   - **Mac**: `Cmd + K`
   - **Windows/Linux**: `Ctrl + K`

2. **Click**
   - Click on the search box in the navigation bar

### Searching
1. Type your search query (minimum 2 characters)
2. Results appear automatically as you type (after 300ms delay)
3. Results are grouped by:
   - **Projects** (folder icon)
   - **Tasks** (file icon)
   - **Comments** (message icon)

### Navigating Results
- **Click** any result to navigate to its detail page
- **Escape** key to close the search
- Search automatically closes when you select a result

## 📊 What Gets Searched

### Projects
- Project name
- Project description

### Tasks
- Task title
- Task description
- Shows status and priority badges

### Comments
- Comment content
- Shows author information

## ⚡ Performance Features

- **Smart Debouncing**: Waits for you to finish typing before searching
- **Request Cancellation**: Cancels outdated searches automatically
- **Result Caching**: Remembers your recent searches for instant results
- **Parallel Search**: Searches all resources simultaneously

## 🎨 Visual States

1. **Loading**: Spinning loader while searching
2. **Results**: Shows up to 5 results per category
3. **No Results**: Helpful message when nothing is found
4. **Error**: Clear error message if something goes wrong

## 🔧 Developer Notes

### Component Location
```
AngularProject/src/app/layout/global-search/
├── global-search.component.ts
├── global-search.component.html
└── global-search.component.css
```

### Service Location
```
AngularProject/src/app/core/services/search.service.ts
```

### Example: Programmatic Usage
```typescript
import { ViewChild } from '@angular/core';
import { GlobalSearchComponent } from './layout/global-search/global-search.component';

export class MyComponent {
  @ViewChild(GlobalSearchComponent) search!: GlobalSearchComponent;

  openSearch() {
    this.search.openSearch();
  }
  
  closeSearch() {
    this.search.closeSearch();
  }
}
```

### Example: Direct Service Usage
```typescript
import { SearchService } from './core/services/search.service';

constructor(private searchService: SearchService) {}

performSearch() {
  this.searchService.globalSearch('my query', 10)
    .subscribe(results => {
      console.log('Found:', {
        tasks: results.tasks.length,
        projects: results.projects.length,
        comments: results.comments.length
      });
    });
}
```

## 🎯 Tips

1. **Be Specific**: More specific queries return better results
2. **Use Keyboard**: `Cmd/Ctrl + K` is the fastest way to search
3. **Recent Results**: Your last 10 searches are cached for speed
4. **Minimum 2 Characters**: Search activates after typing at least 2 characters

## 🔍 Advanced Usage

### Clear Cache
If you want to force fresh results:
```typescript
import { SearchService } from './core/services/search.service';

constructor(private searchService: SearchService) {}

clearSearchCache() {
  this.searchService.clearCache();
}
```

### Search Specific Resources
```typescript
// Search only tasks
this.searchService.searchTasks({ 
  q: 'query',
  status: 'TODO',
  priority: 'HIGH',
  limit: 20 
}).subscribe(result => {
  console.log('Tasks:', result.data);
});

// Search only comments
this.searchService.searchComments({ 
  q: 'query',
  limit: 20 
}).subscribe(result => {
  console.log('Comments:', result.data);
});

// Search only projects
this.searchService.searchProjects('query')
  .subscribe(projects => {
    console.log('Projects:', projects);
  });
```

## ♿ Accessibility

- Fully keyboard accessible
- Screen reader friendly with ARIA attributes
- Focus management for better navigation
- High contrast for visibility

## 🐛 Troubleshooting

### Search Not Opening
- Check if keyboard shortcut is working: Try `Cmd+K` or `Ctrl+K`
- Try clicking the search box directly

### No Results Appearing
- Make sure you typed at least 2 characters
- Wait for 300ms after typing
- Check browser console for errors
- Verify backend API is running

### Slow Performance
- Check network connection
- Verify backend response time
- Clear search cache if needed

## 📱 Mobile Support

- Touch-friendly interface
- Responsive dropdown positioning
- Optimized for mobile viewports
- Same search functionality as desktop

## 🎓 Learn More

See the full implementation documentation:
- [GLOBAL_SEARCH_IMPLEMENTATION.md](./GLOBAL_SEARCH_IMPLEMENTATION.md)

For questions or issues, contact the development team.
