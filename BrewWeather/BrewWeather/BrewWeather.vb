<ComClass(BrewWeather.ClassId, BrewWeather.InterfaceId, BrewWeather.EventsId)> _
Public Class BrewWeather

#Region "COM GUIDs"
    ' These  GUIDs provide the COM identity for this class 
    ' and its COM interfaces. If you change them, existing 
    ' clients will no longer be able to access the class.
    Public Const ClassId As String = "43815b06-9600-48d9-b6c1-5401cc690d57"
    Public Const InterfaceId As String = "22e7bfa9-1f43-4ef0-97a5-85a9587f505f"
    Public Const EventsId As String = "a4f5a524-56f3-4f1c-bfe6-07f01dd76b72"
#End Region

    ' class variables
    Private c_Temperature As Double

    ' A creatable COM class must have a Public Sub New() 
    ' with no parameters, otherwise, the class will not be 
    ' registered in the COM registry and cannot be created 
    ' via CreateObject.
    Public Sub New()
        MyBase.New()
        c_Temperature = 0
    End Sub

    Public Property Temperature As Double
        Get
            Temperature = c_Temperature
        End Get
        Set(value As Double)
            c_Temperature = value
        End Set
    End Property
End Class


