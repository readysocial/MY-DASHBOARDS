listenerRouter
  .route("/:listenerId/status")
  .patch(
    validateInput(ActivateDeactivateListenerSchema),
    checkIfAdmin,
    listenerController.activateDeactivateListener
  );



  // Request
PATCH /listeners/123/status
{
    "active": true
}

// Response (200 OK)
{
    "message": "Listener activated successfully."
}


// Request
PATCH /listeners/123/status
{
    "active": false
}

// Response (200 OK)
{
    "message": "Listener deactivated successfully."
}


// 404 Not Found
{
    "message": "Listener not found"
}

// 401 Unauthorized
{
    "message": "Bearer token not provided."
}

// 403 Forbidden
{
    "message": "Cannot authenticate admin"
}