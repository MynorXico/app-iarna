const defaultImages = [
    "assets/img1.png",
    "assets/img2.png",
    "assets/img3.png",
    "assets/img4.png"
];

export class SurveyModel {
    AllowAccessResult: boolean;
    CreatedAt: string;
    CreatorId: string;
    Id: string;
    IsArchived: boolean;
    IsPublished: boolean;
    Name: string;
    PostId: string;
    PublishId: string;
    ResultId: string;
    StoreIPAddress: boolean;
    UseCookies: boolean;
    UserId: string;
    Image: string;
    ImageOffline: string;


    // Copy constructor.
    constructor(obj: SurveyModel) {
        this.AllowAccessResult = obj['AllowAccessResult'];
        this.CreatedAt = obj['CreatedAt'];
        this.CreatorId = obj['CreatorId'];
        this.Id = obj['Id'];
        this.IsArchived = obj['IsArchived'];
        this.IsPublished = obj['IsPublished'];
        this.Name = obj['Name'];
        this.PostId = obj['PostId'];
        this.PublishId = obj['PublishId'];
        this.ResultId = obj['ResultId'];
        this.StoreIPAddress = obj['StoreIPAddress'];
        this.UseCookies = obj['UseCookies'];
        this.UserId = obj['UserId'];
        this.Image = obj['Image'] || defaultImages[Math.floor(Math.random() * defaultImages.length)];
        this.ImageOffline = "assets/offlinesurveys-mod.png";
    }

    // New static method.
    static fromJSONArray(array: Array<SurveyModel>): SurveyModel[] {
        return array.map(obj => new SurveyModel(obj)
    )}

}