# Database Configuration

## MongoDB Atlas Setup

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/tarot?retryWrites=true&w=majority
```

### Collections
- **users**: User accounts (email, username, password)
- **readings**: Tarot readings (cards, interpretations, ratings)
- **passwordresets**: Password reset tokens (TTL: 1 hour)

## Indexes

### users
- `email` (unique) - Fast user lookup by email
- `username` (unique) - Fast username validation
- `createdAt` - User registration analytics and sorting

### readings
- `userId + createdAt` (compound, descending) - User reading history (optimized for dashboard)
- `createdAt` - Recent readings queries
- `rating` - Rating queries and analytics

### passwordresets
- `userId` - Find all reset tokens for a user
- `token` (unique) - Fast token validation during reset
- `expiresAt` (TTL index - auto-deletes expired tokens)
- `userId + expiresAt` (compound) - Find valid tokens for user
- `createdAt` - Auditing and cleanup operations

## Connection Pooling

### Configuration
- **Max Pool Size**: 10 connections
- **Min Pool Size**: 5 connections
- **Max Idle Time**: 30 seconds
- **Server Selection Timeout**: 5 seconds
- **Socket Timeout**: 45 seconds

### Benefits
- Reuse connections (faster response times)
- Handle concurrent requests efficiently
- Automatic reconnection on connection loss
- Resource optimization for serverless environments

## Monitoring

### Check Connection Status
```bash
npm run db:indexes
```

This command verifies all indexes are properly created in the database.

### MongoDB Atlas Dashboard
- Monitor query performance
- Check slow queries (>100ms)
- Review index usage statistics
- Set up alerts for connection issues
- Track database size and storage

### Query Monitoring
Query monitoring is automatically enabled in production or when `ENABLE_QUERY_MONITORING` environment variable is set. It logs:
- All database queries with execution duration
- Slow queries (> 100ms) with full query details
- Query patterns for optimization

## Performance Tips

1. **Always use indexes for queries** - Ensure your queries leverage existing indexes
2. **Use lean() for read-only queries** - Skips hydration for better performance
3. **Limit result sets with pagination** - Prevent memory issues with large datasets
4. **Project only needed fields** - Use `.select()` to return only required fields
5. **Use compound indexes for common query patterns** - Optimize frequently used query combinations

## Backup Strategy

### MongoDB Atlas Backups
- **Automatic daily backups** - Configured in Atlas
- **Point-in-time recovery** - Restore to any point in time
- **7-day retention** (free tier) - Upgrade for longer retention

### Manual Backup
```bash
mongodump --uri="mongodb+srv://..." --out=./backup
```

### Restore from Backup
```bash
mongorestore --uri="mongodb+srv://..." ./backup
```

## Health Check

Access the health check endpoint at `/api/health` to verify:
- Database connection status
- Number of collections
- Memory usage
- Application uptime

## Troubleshooting

### Connection Pool Exhausted
If you see connection pool exhaustion errors:
1. Check for connection leaks in your code
2. Ensure you're not creating new connections in loops
3. Verify connection pool settings are appropriate for your load
4. Review concurrent request patterns

### Slow Queries
If queries are slow:
1. Check the slow query logs in monitoring
2. Verify indexes are being used (use `explain()` in MongoDB)
3. Consider adding additional indexes for common query patterns
4. Use projection to limit returned fields
5. Implement pagination for large result sets

### Memory Issues
If memory usage is high:
1. Check connection pool size
2. Review query result sizes
3. Use pagination for large result sets
4. Consider using `.lean()` for read-only operations
5. Monitor MongoDB Atlas metrics

### Index Creation Failures
If indexes fail to create:
1. Run `npm run db:indexes` to verify current indexes
2. Check for duplicate data preventing unique indexes
3. Review index size limits
4. Check MongoDB Atlas logs for errors
